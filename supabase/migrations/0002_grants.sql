-- Grants table-level privileges to the `authenticated` role (which anonymous
-- sessions also use, per Supabase). RLS policies from 0001_init.sql still
-- control which *rows* are visible/writable — this just allows the role to
-- query the tables at all. Without this, every request gets a bare
-- "permission denied for table ..." from Postgres before RLS is even
-- evaluated.
-- Run this once in the Supabase Dashboard: SQL Editor → New Query → paste → Run.

grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.friends to authenticated;
grant select, insert, update, delete on public.receipts to authenticated;
grant select, insert, update, delete on public.receipt_items to authenticated;
grant select, insert, update, delete on public.splits to authenticated;
grant select, insert, update, delete on public.split_members to authenticated;
grant select, insert, update, delete on public.split_item_assignments to authenticated;
