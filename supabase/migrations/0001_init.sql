-- Splitzel initial schema
-- Run this once in the Supabase Dashboard: SQL Editor → New Query → paste → Run.

-- ─────────────────────────────────────────────────────────────
-- profiles: one row per auth user (real or anonymous)
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  avatar_color text not null default '#192F4D',
  gcash_number text,
  gcash_name text,
  bank_name text,
  bank_account_number text,
  bank_account_name text,
  has_qr boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- auto-create a blank profile row whenever a new auth user is created
-- (covers anonymous sign-ins today, and real Google/Apple sign-ins later)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- friends: personal directory (not yet 2-way connected accounts)
-- ─────────────────────────────────────────────────────────────
create table public.friends (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  phone text,
  avatar_color text not null default '#5AAFED',
  gcash_number text,
  gcash_name text,
  bank_name text,
  bank_account_number text,
  bank_account_name text,
  has_qr boolean not null default false,
  created_at timestamptz not null default now()
);

create index friends_owner_id_idx on public.friends (owner_id);

alter table public.friends enable row level security;

create policy "friends: all actions on own rows" on public.friends
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ─────────────────────────────────────────────────────────────
-- receipts + line items
-- ─────────────────────────────────────────────────────────────
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  establishment text not null,
  receipt_date timestamptz not null default now(),
  subtotal numeric(10, 2) not null,
  vat_rate numeric(5, 4) not null default 0.12,
  service_charge_rate numeric(5, 4) not null default 0.10,
  vat numeric(10, 2) not null,
  service_charge numeric(10, 2) not null,
  total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index receipts_owner_id_idx on public.receipts (owner_id);

alter table public.receipts enable row level security;

create policy "receipts: all actions on own rows" on public.receipts
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts (id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null,
  quantity integer not null default 1
);

create index receipt_items_receipt_id_idx on public.receipt_items (receipt_id);

alter table public.receipt_items enable row level security;

create policy "receipt_items: all actions via owning receipt" on public.receipt_items
  for all using (
    exists (
      select 1 from public.receipts r
      where r.id = receipt_items.receipt_id and r.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.receipts r
      where r.id = receipt_items.receipt_id and r.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- splits: a bill-splitting session tied to one receipt
-- ─────────────────────────────────────────────────────────────
create table public.splits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  receipt_id uuid not null references public.receipts (id) on delete cascade,
  method text not null check (method in ('item', 'even')),
  -- null payee_friend_id means the owner themself is the payee
  payee_friend_id uuid references public.friends (id) on delete set null,
  created_at timestamptz not null default now()
);

create index splits_owner_id_idx on public.splits (owner_id);
create index splits_receipt_id_idx on public.splits (receipt_id);

alter table public.splits enable row level security;

create policy "splits: all actions on own rows" on public.splits
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table public.split_members (
  id uuid primary key default gen_random_uuid(),
  split_id uuid not null references public.splits (id) on delete cascade,
  member_type text not null check (member_type in ('me', 'friend', 'guest')),
  friend_id uuid references public.friends (id) on delete set null,
  guest_name text,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at timestamptz
);

create index split_members_split_id_idx on public.split_members (split_id);

alter table public.split_members enable row level security;

create policy "split_members: all actions via owning split" on public.split_members
  for all using (
    exists (
      select 1 from public.splits s
      where s.id = split_members.split_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.splits s
      where s.id = split_members.split_id and s.owner_id = auth.uid()
    )
  );

create table public.split_item_assignments (
  id uuid primary key default gen_random_uuid(),
  split_id uuid not null references public.splits (id) on delete cascade,
  receipt_item_id uuid not null references public.receipt_items (id) on delete cascade,
  split_member_id uuid not null references public.split_members (id) on delete cascade
);

create index split_item_assignments_split_id_idx on public.split_item_assignments (split_id);

alter table public.split_item_assignments enable row level security;

create policy "split_item_assignments: all actions via owning split" on public.split_item_assignments
  for all using (
    exists (
      select 1 from public.splits s
      where s.id = split_item_assignments.split_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.splits s
      where s.id = split_item_assignments.split_id and s.owner_id = auth.uid()
    )
  );
