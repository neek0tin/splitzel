-- Fixes: the split owner couldn't see split_payments rows for their own
-- splits (e.g. a guest's partial payment vanished from the UI after any
-- refetch). 0011's "select as split member" policy checks is_split_member(),
-- which matches on split_members.user_id -- but the owner's own "me" row
-- always has user_id = null (their identity is implicit via splits.owner_id,
-- set that way by createSplit), so it never matched them. Every other table
-- in this project has a separate owner-specific policy alongside its
-- membership-based one for exactly this reason; split_payments was missing
-- its counterpart. Multiple permissive RLS policies for the same command are
-- OR'd together, so this is additive, not a replacement.
-- Run this once in the Supabase Dashboard: SQL Editor -> New Query -> paste -> Run.

create policy "split_payments: select as split owner" on public.split_payments
  for select using (
    exists (
      select 1 from public.split_members sm
      join public.splits s on s.id = sm.split_id
      where sm.id = split_payments.split_member_id and s.owner_id = auth.uid()
    )
  );
