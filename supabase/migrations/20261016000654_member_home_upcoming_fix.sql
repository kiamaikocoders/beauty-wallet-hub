-- Show all open bookings on home; demo avatars for Amani/Brian.
create or replace function public.member_session(p_demo text default null)
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  pid uuid := private.resolve_member_id(p_demo);
  row record;
  avatar text;
begin
  if pid is null then
    return null;
  end if;
  select
    p.id, p.full_name, p.email, p.phone, p.area, p.tier, p.status, p.renews_on, p.avatar_url,
    p.created_at, w.available, w.on_hold, w.rollover, t.name as tier_name, t.monthly_coins, t.price_ksh
  into row
  from public.profiles p
  join public.wallets w on w.profile_id = p.id
  left join public.tiers t on t.id = p.tier
  where p.id = pid;
  avatar := coalesce(
    nullif(row.avatar_url, ''),
    case when row.full_name = 'Brian Otieno' then '/images/people/brian-otieno.png'
         else '/images/people/amani-wanjiru.png' end
  );
  return json_build_object(
    'id', row.id,
    'fullName', row.full_name,
    'email', row.email,
    'phone', coalesce(row.phone, '0712 345 678'),
    'area', row.area,
    'tier', row.tier,
    'tierName', row.tier_name,
    'status', row.status,
    'renewsOn', row.renews_on,
    'avatarUrl', avatar,
    'createdAt', row.created_at,
    'monthlyCoins', row.monthly_coins,
    'priceKsh', row.price_ksh,
    'wallet', json_build_object(
      'available', row.available,
      'onHold', row.on_hold,
      'rollover', row.rollover
    ),
    'demo', (select auth.uid()) is null
  );
end;
$$;

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
