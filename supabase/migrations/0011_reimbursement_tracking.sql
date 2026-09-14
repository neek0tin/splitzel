-- Premium: "advanced reimbursement tracking" (partial payments + a paid/owed
-- ledger a member can build up over time, on top of the existing binary
-- paid/pending status) and "automatic adjustments" (editing a split's receipt
-- after creation, with everyone's share recalculating live since shares were
-- already computed on the fly from receipt+assignments+method, never cached).
-- Run this once in the Supabase Dashboard: SQL Editor -> New Query -> paste -> Run.

-- ─────────────────────────────────────────────────────────────
-- split_payments: a running log of partial payments per member
-- ─────────────────────────────────────────────────────────────
-- Deliberately additive, not a replacement for split_members.status: a member
-- is only flipped to 'paid' (via the existing mark_split_member_paid) once
-- their logged payments cover their full share -- this table is purely the
-- detail layer underneath that, so nothing about the existing paid/pending
-- flow has to change.

create table public.split_payments (
  id uuid primary key default gen_random_uuid(),
  split_member_id uuid not null references public.split_members (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index split_payments_member_idx on public.split_payments (split_member_id, created_at);

alter table public.split_payments enable row level security;

create policy "split_payments: select as split member" on public.split_payments
  for select using (
    exists (
      select 1 from public.split_members sm
      where sm.id = split_payments.split_member_id and public.is_split_member(sm.split_id, auth.uid())
    )
  );

-- Table-level grant, separate from the RLS policy above -- per 0002_grants.sql,
-- without this every request gets a bare "permission denied" before RLS is
-- even evaluated. No insert/update/delete grant: all writes go through
-- record_split_payment, which runs as its SECURITY DEFINER owner, not as
-- the calling `authenticated` role.
grant select on public.split_payments to authenticated;

-- No insert/update/delete policy for authenticated -- every row is written by
-- record_split_payment below, which does its own authorization check.

-- Matches 0010: service_role needs an explicit grant to touch this table at
-- all, since RLS-bypass and table-level privileges are separate mechanisms.
grant select, insert, update, delete on public.split_payments to service_role;

-- ─────────────────────────────────────────────────────────────
-- notifications: new type for split edits
-- ─────────────────────────────────────────────────────────────

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('split_added', 'member_paid', 'marked_received', 'nudge', 'split_edited'));

-- ─────────────────────────────────────────────────────────────
-- record_split_payment: either the paying member (self-reporting a partial
-- payment) or the split owner (logging a payment they received, e.g. cash
-- from a guest) may call this.
-- ─────────────────────────────────────────────────────────────

create or replace function public.record_split_payment(p_split_member_id uuid, p_amount numeric)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_split_id uuid;
  v_owner_id uuid;
  v_member_user_id uuid;
  v_establishment text;
  v_actor_name text;
begin
  if p_amount <= 0 then
    raise exception 'Payment amount must be positive';
  end if;

  select sm.split_id, s.owner_id, sm.user_id
    into v_split_id, v_owner_id, v_member_user_id
  from public.split_members sm
  join public.splits s on s.id = sm.split_id
  where sm.id = p_split_member_id;

  if v_split_id is null then
    raise exception 'Split member not found';
  end if;

  if auth.uid() <> v_owner_id and auth.uid() <> v_member_user_id then
    raise exception 'Not authorized to record a payment for this member';
  end if;

  insert into public.split_payments (split_member_id, amount) values (p_split_member_id, p_amount);

  select r.establishment into v_establishment
  from public.splits s join public.receipts r on r.id = s.receipt_id
  where s.id = v_split_id;

  select trim(p.first_name || ' ' || p.last_name) into v_actor_name
  from public.profiles p where p.id = auth.uid();

  if auth.uid() = v_member_user_id and v_owner_id <> auth.uid() then
    insert into public.notifications (user_id, actor_id, type, split_id, title, body)
    values (
      v_owner_id, auth.uid(), 'member_paid', v_split_id, 'Partial Payment',
      coalesce(v_actor_name, 'Someone') || ' paid ' || to_char(p_amount, 'FM999999990.00') ||
        ' towards ' || coalesce(v_establishment, 'a split')
    );
  elsif auth.uid() = v_owner_id and v_member_user_id is not null and v_member_user_id <> v_owner_id then
    insert into public.notifications (user_id, actor_id, type, split_id, title, body)
    values (
      v_member_user_id, auth.uid(), 'marked_received', v_split_id, 'Payment Logged',
      coalesce(v_actor_name, 'Someone') || ' logged a payment of ' || to_char(p_amount, 'FM999999990.00') ||
        ' from you for ' || coalesce(v_establishment, 'a split')
    );
  end if;
end;
$$;

grant execute on function public.record_split_payment(uuid, numeric) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- notify_split_edited: the actual edits (receipt/items/assignments) go
-- through plain client-side table writes, already gated by the existing
-- owner-only RLS on receipts/receipt_items/split_item_assignments -- this
-- just handles telling every other member their share may have changed.
-- ─────────────────────────────────────────────────────────────

create or replace function public.notify_split_edited(p_split_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner_id uuid;
  v_establishment text;
  v_actor_name text;
  v_member record;
begin
  select s.owner_id, r.establishment into v_owner_id, v_establishment
  from public.splits s join public.receipts r on r.id = s.receipt_id
  where s.id = p_split_id;

  if v_owner_id is null then
    raise exception 'Split not found';
  end if;
  if auth.uid() <> v_owner_id then
    raise exception 'Only the split owner can edit this split';
  end if;

  select trim(p.first_name || ' ' || p.last_name) into v_actor_name
  from public.profiles p where p.id = auth.uid();

  for v_member in
    select sm.user_id from public.split_members sm
    where sm.split_id = p_split_id and sm.user_id is not null and sm.user_id <> auth.uid()
  loop
    insert into public.notifications (user_id, actor_id, type, split_id, title, body)
    values (
      v_member.user_id, auth.uid(), 'split_edited', p_split_id, 'Split Updated',
      coalesce(v_actor_name, 'Someone') || ' updated the split at ' || coalesce(v_establishment, 'a place') ||
        ' — check your new share.'
    );
  end loop;
end;
$$;

grant execute on function public.notify_split_edited(uuid) to authenticated;
