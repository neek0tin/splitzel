-- Premium subscription: a paid tier (receipt scanning, automatic adjustments,
-- advanced reimbursement tracking, unlimited bill-splitting sessions) on top of
-- the free bill-splitting + payment tracking every account already gets.
-- Billed manually month-to-month via PayMongo Checkout Sessions (not real
-- recurring billing -- PayMongo doesn't support that on an individual account,
-- so each month is its own one-time payment that extends premium_until).
-- Run this once in the Supabase Dashboard: SQL Editor -> New Query -> paste -> Run.

-- No separate is_premium flag -- premium_until is the single source of truth.
-- null means never subscribed; a past timestamp means lapsed; a future one
-- means active. Computed as a boolean client-side, nothing to keep in sync.
alter table public.profiles add column if not exists premium_until timestamptz;

-- ─────────────────────────────────────────────────────────────
-- payments: an audit trail of premium purchases
-- ─────────────────────────────────────────────────────────────
-- Deliberately has no insert/update/delete policy for anon/authenticated --
-- every row is written by the webhook route using the Supabase service-role
-- key (bypasses RLS), never by a client directly. That's what makes this an
-- honest record: a signed-in user can read their own history but cannot grant
-- themselves premium by writing here.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'paymongo',
  -- PayMongo checkout session id. Unique + checked before crediting so a
  -- retried webhook delivery for the same event can't double-extend premium.
  provider_checkout_id text not null unique,
  amount numeric(10, 2) not null,
  currency text not null default 'PHP',
  status text not null check (status in ('paid', 'failed')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  created_at timestamptz not null default now()
);

create index payments_user_id_idx on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

create policy "payments: select own" on public.payments
  for select using (auth.uid() = user_id);
