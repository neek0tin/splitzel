-- Real GCash QR images, replacing the `has_qr` boolean that never had an actual
-- image behind it (the settle-up screen was rendering a decorative SVG of random
-- squares). Each profile now stores a path into the public `gcash-qr` bucket.
-- Run this once in the Supabase Dashboard: SQL Editor -> New Query -> paste -> Run.

alter table public.profiles add column if not exists gcash_qr_path text;

-- `has_qr` is deliberately left in place. Dropping it here would break any
-- checkout still selecting it, and this app currently has an unmerged fork in
-- the wild. Remove it in a follow-up migration once every tree reads
-- gcash_qr_path instead.

-- ─────────────────────────────────────────────────────────────
-- storage bucket
-- ─────────────────────────────────────────────────────────────
-- Public read, because a QR is only useful if the person paying you can load
-- it, and a private bucket would need a signed-URL round trip gated on split
-- membership that doesn't exist yet. The protection here is the UNGUESSABLE
-- FILENAME, not the bucket ACL -- anyone handed the URL can view the image.
-- That is an accepted prototype tradeoff, not an oversight.
--
-- Objects live at `<owner uuid>/<random uuid>.jpg`: the folder segment makes
-- ownership checkable in policy, the random segment makes the URL unguessable.
insert into storage.buckets (id, name, public)
values ('gcash-qr', 'gcash-qr', true)
on conflict (id) do nothing;

create policy "gcash-qr: public read" on storage.objects
  for select using (bucket_id = 'gcash-qr');

create policy "gcash-qr: insert into own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'gcash-qr'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "gcash-qr: update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'gcash-qr'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "gcash-qr: delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'gcash-qr'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────
-- expose the new column through the friends list
-- ─────────────────────────────────────────────────────────────
-- The settle-up screen reads the payee out of list_my_friends(), so the QR path
-- has to come back from here too. `create or replace` cannot change a function's
-- return signature, so the old one is dropped first.

drop function if exists public.list_my_friends();

create function public.list_my_friends()
returns table (
  id uuid,
  first_name text,
  last_name text,
  avatar_color text,
  gcash_number text,
  gcash_name text,
  bank_name text,
  bank_account_number text,
  bank_account_name text,
  gcash_qr_path text,
  connected_at timestamptz
)
language sql
security definer set search_path = public
as $$
  select
    p.id, p.first_name, p.last_name, p.avatar_color,
    p.gcash_number, p.gcash_name, p.bank_name,
    p.bank_account_number, p.bank_account_name, p.gcash_qr_path,
    fc.created_at as connected_at
  from public.friend_connections fc
  join public.profiles p
    on p.id = case when fc.user_id_1 = auth.uid() then fc.user_id_2 else fc.user_id_1 end
  where auth.uid() in (fc.user_id_1, fc.user_id_2)
  order by fc.created_at asc;
$$;

grant execute on function public.list_my_friends() to authenticated;
