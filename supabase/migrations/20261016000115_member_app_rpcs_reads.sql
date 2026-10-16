create or replace function public.member_home(p_demo text default null)
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  pid uuid := private.resolve_member_id(p_demo);
  session json;
  upcoming json;
  activity json;
begin
  if pid is null then
    return null;
  end if;
  session := public.member_session(p_demo);

  select coalesce(json_agg(x order by x->>'scheduledAt'), '[]'::json) into upcoming
  from (
    select json_build_object(
      'id', b.id,
      'status', b.status,
      'coins', b.coins,
      'scheduledAt', b.scheduled_at,
      'serviceName', (select s.name from public.booking_items bi join public.services s on s.id = bi.service_id where bi.booking_id = b.id limit 1),
      'providerName', pr.name,
      'providerSlug', pr.slug,
      'providerArea', pr.area,
      'minutes', coalesce((select sum(s.minutes) from public.booking_items bi join public.services s on s.id = bi.service_id where bi.booking_id = b.id), 0),
      'pin', bp.pin
    ) as x
    from public.bookings b
    join public.providers pr on pr.id = b.provider_id
    left join public.booking_pins bp on bp.booking_id = b.id
    where b.member_profile_id = pid
      and b.status in ('booked', 'arriving', 'in_progress')
      and b.scheduled_at >= (now() - interval '2 hours')
    order by b.scheduled_at
    limit 5
  ) q;

  select coalesce(json_agg(x order by (x->>'at') desc), '[]'::json) into activity
  from (
    select json_build_object(
      'id', ct.id,
      'kind', ct.kind,
      'coins', ct.coins,
      'note', ct.note,
      'at', ct.created_at,
      'bookingId', ct.booking_id
    ) as x
    from public.coin_transactions ct
    where ct.profile_id = pid
    order by ct.created_at desc
    limit 8
  ) q;

  return json_build_object(
    'member', session,
    'upcoming', upcoming,
    'activity', activity
  );
end;
$$;
revoke all on function public.member_home(text) from public;
grant execute on function public.member_home(text) to anon, authenticated;

create or replace function public.member_bookings(p_demo text default null, p_tab text default 'upcoming')
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  pid uuid := private.resolve_member_id(p_demo);
  rows json;
begin
  if pid is null then
    return '[]'::json;
  end if;

  select coalesce(json_agg(x order by (x->>'scheduledAt') desc), '[]'::json) into rows
  from (
    select json_build_object(
      'id', b.id,
      'status', b.status,
      'coins', b.coins,
      'cashKsh', b.cash_ksh,
      'scheduledAt', b.scheduled_at,
      'addons', b.addons,
      'serviceName', (select s.name from public.booking_items bi join public.services s on s.id = bi.service_id where bi.booking_id = b.id limit 1),
      'providerName', pr.name,
      'providerSlug', pr.slug,
      'providerArea', pr.area,
      'minutes', coalesce((select sum(s.minutes) from public.booking_items bi join public.services s on s.id = bi.service_id where bi.booking_id = b.id), 0),
      'rated', exists(select 1 from public.reviews r where r.booking_id = b.id),
      'pin', case when b.status in ('booked', 'arriving', 'in_progress') then bp.pin else null end
    ) as x
    from public.bookings b
    join public.providers pr on pr.id = b.provider_id
    left join public.booking_pins bp on bp.booking_id = b.id
    where b.member_profile_id = pid
      and (
        (p_tab = 'upcoming' and b.status in ('booked', 'arriving', 'in_progress'))
        or (p_tab = 'past' and b.status in ('done', 'no_show'))
        or (p_tab = 'cancelled' and b.status = 'cancelled')
        or (p_tab = 'all')
      )
    order by b.scheduled_at desc
  ) q;

  return rows;
end;
$$;
revoke all on function public.member_bookings(text, text) from public;
grant execute on function public.member_bookings(text, text) to anon, authenticated;

create or replace function public.member_booking_detail(p_booking_id uuid, p_demo text default null)
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  pid uuid := private.resolve_member_id(p_demo);
  row record;
begin
  if pid is null then
    raise exception 'Sign in required' using errcode = 'P0001';
  end if;

  select
    b.*, pr.name as provider_name, pr.slug as provider_slug, pr.area as provider_area,
    pr.class as provider_class, bp.pin,
    (select s.name from public.booking_items bi join public.services s on s.id = bi.service_id where bi.booking_id = b.id limit 1) as service_name,
    coalesce((select sum(s.minutes) from public.booking_items bi join public.services s on s.id = bi.service_id where bi.booking_id = b.id), 0) as minutes,
    exists(select 1 from public.reviews r where r.booking_id = b.id) as rated
  into row
  from public.bookings b
  join public.providers pr on pr.id = b.provider_id
  left join public.booking_pins bp on bp.booking_id = b.id
  where b.id = p_booking_id and b.member_profile_id = pid;

  if row.id is null then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;

  return json_build_object(
    'id', row.id,
    'status', row.status,
    'coins', row.coins,
    'cashKsh', row.cash_ksh,
    'scheduledAt', row.scheduled_at,
    'addons', row.addons,
    'serviceName', row.service_name,
    'providerName', row.provider_name,
    'providerSlug', row.provider_slug,
    'providerArea', row.provider_area,
    'providerClass', row.provider_class,
    'minutes', row.minutes,
    'pin', row.pin,
    'rated', row.rated,
    'freeCancelUntil', row.scheduled_at - interval '24 hours',
    'lateCancel', row.scheduled_at < (now() + interval '24 hours')
  );
end;
$$;
revoke all on function public.member_booking_detail(uuid, text) from public;
grant execute on function public.member_booking_detail(uuid, text) to anon, authenticated;

create or replace function public.member_wallet(p_demo text default null)
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  pid uuid := private.resolve_member_id(p_demo);
  session json;
  ledger json;
  spent int;
  topped int;
begin
  if pid is null then
    return null;
  end if;
  session := public.member_session(p_demo);

  select coalesce(sum(case when kind in ('release') then abs(coins) else 0 end), 0),
         coalesce(sum(case when kind = 'top_up' then coins else 0 end), 0)
  into spent, topped
  from public.coin_transactions
  where profile_id = pid
    and created_at >= date_trunc('month', now() at time zone 'Africa/Nairobi') at time zone 'Africa/Nairobi';

  select coalesce(json_agg(x order by (x->>'at') desc), '[]'::json) into ledger
  from (
    select json_build_object(
      'id', ct.id,
      'kind', ct.kind,
      'coins', ct.coins,
      'note', ct.note,
      'at', ct.created_at,
      'bookingId', ct.booking_id
    ) as x
    from public.coin_transactions ct
    where ct.profile_id = pid
    order by ct.created_at desc
    limit 40
  ) q;

  return json_build_object(
    'member', session,
    'spentThisMonth', spent,
    'toppedUpThisMonth', topped,
    'ledger', ledger
  );
end;
$$;
revoke all on function public.member_wallet(text) from public;
grant execute on function public.member_wallet(text) to anon, authenticated;

