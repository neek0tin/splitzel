-- Every table in this project was created via raw SQL migrations rather than
-- the Supabase dashboard's table editor, so `service_role` never got the
-- table-level grants the dashboard normally adds automatically. RLS-bypass and
-- table-level privileges are separate Postgres mechanisms -- service_role
-- bypasses row-level policies by design, but still needs GRANT to touch a
-- table at all, so every service_role query was failing with a bare
-- "permission denied for table ..." before RLS was even evaluated. This
-- first came up for the premium webhook (the first thing in this project to
-- actually use the service-role key), but grants every table server-only
-- code might reasonably need going forward.
-- Run this once in the Supabase Dashboard: SQL Editor -> New Query -> paste -> Run.

grant usage on schema public to service_role;

grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.friend_connections to service_role;
grant select, insert, update, delete on public.receipts to service_role;
grant select, insert, update, delete on public.receipt_items to service_role;
grant select, insert, update, delete on public.splits to service_role;
grant select, insert, update, delete on public.split_members to service_role;
grant select, insert, update, delete on public.split_item_assignments to service_role;
grant select, insert, update, delete on public.notifications to service_role;
grant select, insert, update, delete on public.payments to service_role;
