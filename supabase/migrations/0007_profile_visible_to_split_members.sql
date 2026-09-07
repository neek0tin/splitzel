-- A split member can now see the split itself (0005) and its receipt
-- (0005/0006), but the query also embeds the *owner's profile* (to show
-- their name/avatar) via a join that is itself subject to profiles' RLS --
-- which only ever allowed "see your own profile". PostgREST silently
-- returns null for a joined row hidden by RLS, which crashed the client
-- when a non-owner member fetched a split.
-- Run this once in the Supabase Dashboard: SQL Editor -> New Query -> paste -> Run.

create policy "profiles: select as owner of a shared split" on public.profiles
  for select using (
    exists (
      select 1 from public.splits s
      where s.owner_id = profiles.id and public.is_split_member(s.id, auth.uid())
    )
  );
