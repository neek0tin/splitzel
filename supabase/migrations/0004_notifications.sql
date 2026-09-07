-- Real, live-updating in-app notifications: automatic events (added to a
-- split, a member paid, marked as received) plus manual nudges.
-- Run this once in the Supabase Dashboard: SQL Editor -> New Query -> paste -> Run.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade, -- recipient
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null check (type in ('split_added', 'member_paid', 'marked_received', 'nudge')),
  split_id uuid references public.splits (id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications: select own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications: update own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, update on public.notifications to authenticated;

-- Live updates: broadcast changes on this table over Supabase Realtime.
alter publication supabase_realtime add table public.notifications;

-- ─────────────────────────────────────────────────────────────
-- automatic: notify a friend the moment they're added to a split
-- ─────────────────────────────────────────────────────────────

create or replace function public.notify_new_split_member()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner_id uuid;
  v_owner_name text;
  v_establishment text;
begin
  if new.member_type = 'friend' and new.user_id is not null then
    select s.owner_id, trim(p.first_name || ' ' || p.last_name), r.establishment
      into v_owner_id, v_owner_name, v_establishment
    from public.splits s
    join public.profiles p on p.id = s.owner_id
    join public.receipts r on r.id = s.receipt_id
    where s.id = new.split_id;

    insert into public.notifications (user_id, actor_id, type, split_id, title, body)
    values (
      new.user_id,
      v_owner_id,
      'split_added',
      new.split_id,
      'New Split',
      coalesce(v_owner_name, 'Someone') || ' added you to a split at ' || coalesce(v_establishment, 'a place')
    );
  end if;
  return new;
end;
$$;

create trigger on_split_member_added
  after insert on public.split_members
  for each row execute function public.notify_new_split_member();

-- ─────────────────────────────────────────────────────────────
-- mark_split_member_paid: replaces a plain client-side UPDATE so the
-- authorization check and the resulting notification both live in one
-- place. Either the split owner (marking a friend as received) or the
-- member themself (paying their own share) may call this.
-- ─────────────────────────────────────────────────────────────

create or replace function public.mark_split_member_paid(p_split_member_id uuid)
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
  select sm.split_id, s.owner_id, sm.user_id
    into v_split_id, v_owner_id, v_member_user_id
  from public.split_members sm
  join public.splits s on s.id = sm.split_id
  where sm.id = p_split_member_id;

  if v_split_id is null then
    raise exception 'Split member not found';
  end if;

  if auth.uid() <> v_owner_id and auth.uid() <> v_member_user_id then
    raise exception 'Not authorized to update this member';
  end if;

  update public.split_members
    set status = 'paid', paid_at = now()
    where id = p_split_member_id;

  select r.establishment into v_establishment
  from public.splits s
  join public.receipts r on r.id = s.receipt_id
  where s.id = v_split_id;

  select trim(p.first_name || ' ' || p.last_name) into v_actor_name
  from public.profiles p where p.id = auth.uid();

  if auth.uid() = v_owner_id and v_member_user_id is not null and v_member_user_id <> v_owner_id then
    insert into public.notifications (user_id, actor_id, type, split_id, title, body)
    values (
      v_member_user_id, auth.uid(), 'marked_received', v_split_id, 'Marked as Paid',
      coalesce(v_actor_name, 'Someone') || ' marked you as paid for ' || coalesce(v_establishment, 'a split')
    );
  elsif auth.uid() = v_member_user_id and v_owner_id <> auth.uid() then
    insert into public.notifications (user_id, actor_id, type, split_id, title, body)
    values (
      v_owner_id, auth.uid(), 'member_paid', v_split_id, 'Payment Received',
      coalesce(v_actor_name, 'Someone') || ' paid their share for ' || coalesce(v_establishment, 'a split')
    );
  end if;
end;
$$;

grant execute on function public.mark_split_member_paid(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- nudge_split_member: manual reminder, split owner -> a pending friend
-- ─────────────────────────────────────────────────────────────

create or replace function public.nudge_split_member(p_split_member_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_split_id uuid;
  v_owner_id uuid;
  v_member_user_id uuid;
  v_status text;
  v_establishment text;
  v_actor_name text;
begin
  select sm.split_id, s.owner_id, sm.user_id, sm.status
    into v_split_id, v_owner_id, v_member_user_id, v_status
  from public.split_members sm
  join public.splits s on s.id = sm.split_id
  where sm.id = p_split_member_id;

  if v_split_id is null then
    raise exception 'Split member not found';
  end if;
  if auth.uid() <> v_owner_id then
    raise exception 'Only the split owner can send reminders';
  end if;
  if v_member_user_id is null then
    raise exception 'This member is not a connected friend';
  end if;
  if v_status <> 'pending' then
    raise exception 'This member has already paid';
  end if;

  select r.establishment into v_establishment
  from public.splits s
  join public.receipts r on r.id = s.receipt_id
  where s.id = v_split_id;

  select trim(p.first_name || ' ' || p.last_name) into v_actor_name
  from public.profiles p where p.id = auth.uid();

  insert into public.notifications (user_id, actor_id, type, split_id, title, body)
  values (
    v_member_user_id, auth.uid(), 'nudge', v_split_id, 'Payment Reminder',
    coalesce(v_actor_name, 'Someone') || ' sent you a reminder to settle up for ' || coalesce(v_establishment, 'a split')
  );
end;
$$;

grant execute on function public.nudge_split_member(uuid) to authenticated;
