create or replace function public.member_create_booking(
  p_service_id uuid,
  p_scheduled_at timestamptz,
  p_addons text[] default '{}',
  p_stylist text default null,
  p_demo text default null,
  p_force_slot_taken boolean default false
)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid := private.resolve_member_id(p_demo);
  mem record;
  svc record;
  rules public.coin_rules;
  addon_coins int := 0;
  item_coins int;
  total_coins int;
  cash int;
  payout int;
  bid uuid;
  pin text;
  clash boolean;
begin
  if pid is null then
    raise exception 'Sign in required' using errcode = 'P0001';
  end if;
  if p_force_slot_taken then
    raise exception 'SLOT_TAKEN' using errcode = 'P0003';
  end if;

  select p.*, w.available, w.on_hold into mem
  from public.profiles p join public.wallets w on w.profile_id = p.id
  where p.id = pid;

  select s.*, pr.class as provider_class, pr.id as provider_id, pr.name as provider_name, pr.slug as provider_slug, pr.payout_pct
  into svc
  from public.services s
  join public.providers pr on pr.id = s.provider_id
  where s.id = p_service_id and pr.status = 'live' and s.active;

  if svc.id is null then
    raise exception 'Service not found' using errcode = 'P0002';
  end if;

  select exists(
    select 1 from public.bookings b
    where b.provider_id = svc.provider_id
      and b.status in ('booked', 'arriving', 'in_progress')
      and b.scheduled_at = p_scheduled_at
  ) into clash;
  if clash then
    raise exception 'SLOT_TAKEN' using errcode = 'P0003';
  end if;

  select * into rules from public.coin_rules where id = 1;
  select coalesce(sum(a.coins), 0) into addon_coins
  from public.addons a where a.id = any(coalesce(p_addons, '{}'));

  begin
    item_coins := private.service_coins(svc.cash_ksh, mem.tier, svc.provider_class);
  exception when others then
    raise exception 'UPGRADE_REQUIRED' using errcode = 'P0004';
  end;

  total_coins := item_coins + addon_coins;
  cash := svc.cash_ksh;
  payout := round(cash * svc.payout_pct);

  if mem.available < total_coins then
    raise exception 'NOT_ENOUGH_COINS:%:%', total_coins, mem.available using errcode = 'P0005';
  end if;

  insert into public.bookings (member_profile_id, provider_id, scheduled_at, status, coins, cash_ksh, payout_ksh, addons)
  values (pid, svc.provider_id, p_scheduled_at, 'booked', total_coins, cash, payout, coalesce(p_addons, '{}'))
  returning id into bid;

  insert into public.booking_items (booking_id, service_id, cash_ksh, coins)
  values (bid, svc.id, cash, item_coins);

  pin := lpad((floor(random() * 10000))::int::text, 4, '0');
  insert into public.booking_pins (booking_id, pin) values (bid, pin);

  update public.wallets
  set available = available - total_coins,
      on_hold = on_hold + total_coins,
      updated_at = now()
  where profile_id = pid;

  insert into public.coin_transactions (profile_id, booking_id, kind, coins, note)
  values (pid, bid, 'hold', -total_coins, coalesce(p_stylist, svc.name));

  return json_build_object(
    'id', bid,
    'pin', pin,
    'coins', total_coins,
    'scheduledAt', p_scheduled_at,
    'serviceName', svc.name,
    'providerName', svc.provider_name,
    'providerSlug', svc.provider_slug,
    'stylist', p_stylist,
    'available', mem.available - total_coins,
    'onHold', mem.on_hold + total_coins
  );
end;
$$;
revoke all on function public.member_create_booking(uuid, timestamptz, text[], text, text, boolean) from public;
grant execute on function public.member_create_booking(uuid, timestamptz, text[], text, text, boolean) to anon, authenticated;

create or replace function public.member_cancel_booking(p_booking_id uuid, p_demo text default null)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid := private.resolve_member_id(p_demo);
  b record;
  late boolean;
  to_provider int;
  to_member int;
begin
  if pid is null then
    raise exception 'Sign in required' using errcode = 'P0001';
  end if;

  select * into b from public.bookings where id = p_booking_id and member_profile_id = pid;
  if b.id is null then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if b.status not in ('booked', 'arriving') then
    raise exception 'Cannot cancel' using errcode = 'P0001';
  end if;

  late := b.scheduled_at < (now() + interval '24 hours');
  if late then
    to_provider := round(b.coins::numeric / 2);
    to_member := b.coins - to_provider;
  else
    to_provider := 0;
    to_member := b.coins;
  end if;

  update public.bookings set status = 'cancelled' where id = b.id;
  update public.wallets
  set on_hold = on_hold - b.coins,
      available = available + to_member,
      updated_at = now()
  where profile_id = pid;

  insert into public.coin_transactions (profile_id, booking_id, kind, coins, note)
  values (pid, b.id, 'refund', to_member, case when late then 'Late cancel refund' else 'Free cancel refund' end);

  if to_provider > 0 then
    insert into public.coin_transactions (profile_id, booking_id, kind, coins, note)
    values (pid, b.id, 'release', -to_provider, 'Late cancel to provider');
  end if;

  return json_build_object(
    'id', b.id,
    'late', late,
    'returned', to_member,
    'toProvider', to_provider
  );
end;
$$;
revoke all on function public.member_cancel_booking(uuid, text) from public;
grant execute on function public.member_cancel_booking(uuid, text) to anon, authenticated;

create or replace function public.member_refresh_pin(p_booking_id uuid, p_demo text default null)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid := private.resolve_member_id(p_demo);
  pin text;
begin
  if pid is null then
    raise exception 'Sign in required' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.bookings b
    where b.id = p_booking_id and b.member_profile_id = pid and b.status in ('booked', 'arriving', 'in_progress')
  ) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  pin := lpad((floor(random() * 10000))::int::text, 4, '0');
  update public.booking_pins set pin = pin, updated_at = now() where booking_id = p_booking_id;
  return json_build_object('pin', pin);
end;
$$;
revoke all on function public.member_refresh_pin(uuid, text) from public;
grant execute on function public.member_refresh_pin(uuid, text) to anon, authenticated;

