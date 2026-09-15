-- Private storage bucket for the licensed brand font files (Montserrat Arabic,
-- Basis Grotesque Arabic Pro). These are commercial fonts, so unlike gcash-qr
-- they are NOT committed to git or served publicly -- only the Vercel build
-- step fetches them, using the service-role key, which bypasses RLS entirely.
-- No storage.objects policies are added here on purpose: nothing but the
-- service role should ever read or write this bucket.
-- Run this once in the Supabase Dashboard: SQL Editor -> New Query -> paste -> Run.

insert into storage.buckets (id, name, public)
values ('fonts', 'fonts', false)
on conflict (id) do nothing;
