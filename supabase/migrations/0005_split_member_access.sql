-- Lets a split MEMBER (not just the split's owner) view that split and
-- everything attached to it. Previously only the owner could ever SELECT
-- their own splits, so a friend added to someone else's split had no way
-- to actually see it -- including via a notification linking straight to it.
-- Run this once in the Supabase Dashboard: SQL Editor -> New Query -> paste -> Run.

create policy "splits: select as member" on public.splits
  for select using (
    exists (
      select 1 from public.split_members sm
      where sm.split_id = splits.id and sm.user_id = auth.uid()
    )
  );

create policy "receipts: select as split member" on public.receipts
  for select using (
    exists (
      select 1 from public.splits s
      join public.split_members sm on sm.split_id = s.id
      where s.receipt_id = receipts.id and sm.user_id = auth.uid()
    )
  );

create policy "receipt_items: select as split member" on public.receipt_items
  for select using (
    exists (
      select 1 from public.receipts r
      join public.splits s on s.receipt_id = r.id
      join public.split_members sm on sm.split_id = s.id
      where r.id = receipt_items.receipt_id and sm.user_id = auth.uid()
    )
  );

create policy "split_members: select as fellow member" on public.split_members
  for select using (
    exists (
      select 1 from public.split_members sm2
      where sm2.split_id = split_members.split_id and sm2.user_id = auth.uid()
    )
  );

create policy "split_item_assignments: select as split member" on public.split_item_assignments
  for select using (
    exists (
      select 1 from public.split_members sm
      where sm.split_id = split_item_assignments.split_id and sm.user_id = auth.uid()
    )
  );
