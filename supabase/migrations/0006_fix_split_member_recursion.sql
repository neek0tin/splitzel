-- Fixes "infinite recursion detected in policy for relation split_members"
-- from 0005_split_member_access.sql. Those policies checked membership via
-- a plain EXISTS subquery against split_members from within split_members'
-- own policy (and from policies on related tables that also reference it),
-- which re-triggers split_members' RLS recursively. Routing the membership
-- check through a SECURITY DEFINER function breaks the cycle, since the
-- function's internal query runs as its owner and isn't subject to the
-- calling policy's RLS.
-- Run this once in the Supabase Dashboard: SQL Editor -> New Query -> paste -> Run.

create or replace function public.is_split_member(p_split_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.split_members sm
    where sm.split_id = p_split_id and sm.user_id = p_user_id
  );
$$;

grant execute on function public.is_split_member(uuid, uuid) to authenticated;

drop policy "splits: select as member" on public.splits;
create policy "splits: select as member" on public.splits
  for select using (public.is_split_member(splits.id, auth.uid()));

drop policy "receipts: select as split member" on public.receipts;
create policy "receipts: select as split member" on public.receipts
  for select using (
    exists (
      select 1 from public.splits s
      where s.receipt_id = receipts.id and public.is_split_member(s.id, auth.uid())
    )
  );

drop policy "receipt_items: select as split member" on public.receipt_items;
create policy "receipt_items: select as split member" on public.receipt_items
  for select using (
    exists (
      select 1 from public.receipts r
      join public.splits s on s.receipt_id = r.id
      where r.id = receipt_items.receipt_id and public.is_split_member(s.id, auth.uid())
    )
  );

drop policy "split_members: select as fellow member" on public.split_members;
create policy "split_members: select as fellow member" on public.split_members
  for select using (public.is_split_member(split_members.split_id, auth.uid()));

drop policy "split_item_assignments: select as split member" on public.split_item_assignments;
create policy "split_item_assignments: select as split member" on public.split_item_assignments
  for select using (public.is_split_member(split_item_assignments.split_id, auth.uid()));
