-- Real, bidirectional friend connections between actual Splitzel accounts,
-- replacing the old one-directional "friends" directory table.
-- Run this once in the Supabase Dashboard: SQL Editor -> New Query -> paste -> Run.

-- ─────────────────────────────────────────────────────────────
-- friend codes: a short, shareable code every profile has
-- ─────────────────────────────────────────────────────────────

create or replace function public.generate_friend_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0/O, 1/I/L (easy to misread)
  result text := '';
  i int;
begin
  for i in 1..7 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

alter table public.profiles add column friend_code text;
update public.profiles set friend_code = public.generate_friend_code() where friend_code is null;
alter table public.profiles alter column friend_code set not null;
alter table public.profiles add constraint profiles_friend_code_key unique (friend_code);

-- new users now get a friend_code the moment their account is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, friend_code) values (new.id, public.generate_friend_code());
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- friend_connections: one row per connected pair (undirected)
-- ─────────────────────────────────────────────────────────────

create table public.friend_connections (
  id uuid primary key default gen_random_uuid(),
  user_id_1 uuid not null references public.profiles (id) on delete cascade,
  user_id_2 uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friend_connections_ordered check (user_id_1 < user_id_2),
  constraint friend_connections_unique unique (user_id_1, user_id_2)
);

create index friend_connections_user_id_1_idx on public.friend_connections (user_id_1);
create index friend_connections_user_id_2_idx on public.friend_connections (user_id_2);

alter table public.friend_connections enable row level security;

create policy "friend_connections: select own" on public.friend_connections
  for select using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

create policy "friend_connections: insert own" on public.friend_connections
  for insert with check (auth.uid() = user_id_1 or auth.uid() = user_id_2);

create policy "friend_connections: delete own" on public.friend_connections
  for delete using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

grant select, insert, delete on public.friend_connections to authenticated;

-- ─────────────────────────────────────────────────────────────
-- lookup functions (security definer: these are the only way to see
-- another user's profile at all, and each is scoped to what it needs)
-- ─────────────────────────────────────────────────────────────

-- Look up someone by their friend code (used before connecting, to confirm
-- who you're about to add). Only exposes name/avatar, never payment info.
create or replace function public.find_profile_by_friend_code(p_code text)
returns table (id uuid, first_name text, last_name text, avatar_color text)
language sql
security definer set search_path = public
as $$
  select p.id, p.first_name, p.last_name, p.avatar_color
  from public.profiles p
  where p.friend_code = upper(p_code)
  limit 1;
$$;

grant execute on function public.find_profile_by_friend_code(text) to authenticated;

-- Returns the caller's connected friends, sourced from each friend's own
-- real profile (name, avatar, and the payment info they set for themselves).
create or replace function public.list_my_friends()
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
  has_qr boolean,
  connected_at timestamptz
)
language sql
security definer set search_path = public
as $$
  select
    p.id, p.first_name, p.last_name, p.avatar_color,
    p.gcash_number, p.gcash_name, p.bank_name,
    p.bank_account_number, p.bank_account_name, p.has_qr,
    fc.created_at as connected_at
  from public.friend_connections fc
  join public.profiles p
    on p.id = case when fc.user_id_1 = auth.uid() then fc.user_id_2 else fc.user_id_1 end
  where auth.uid() in (fc.user_id_1, fc.user_id_2)
  order by fc.created_at asc;
$$;

grant execute on function public.list_my_friends() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- migrate splits/split_members off the old friends table and onto
-- real profiles, then drop the old directory table
-- ─────────────────────────────────────────────────────────────

drop table public.friends cascade;

alter table public.splits rename column payee_friend_id to payee_user_id;
alter table public.split_members rename column friend_id to user_id;

-- the columns above used to point at rows in the old (now-dropped) friends
-- table, so their values were never real profile IDs to begin with -- null
-- them out before the new FK constraint validates every existing row.
update public.splits set payee_user_id = null
  where payee_user_id is not null and payee_user_id not in (select id from public.profiles);
update public.split_members set user_id = null
  where user_id is not null and user_id not in (select id from public.profiles);

alter table public.splits add constraint splits_payee_user_id_fkey
  foreign key (payee_user_id) references public.profiles (id) on delete set null;

alter table public.split_members add constraint split_members_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete set null;
