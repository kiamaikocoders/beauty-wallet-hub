-- Provider portal: demo read RPC + PIN check-in that releases coins.
-- Applied remotely as provider_portal_check_in.

create or replace function public.demo_provider_portal(p_slug text default 'braid-bar-ngong-rd')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider public.providers%rowtype;
  v_day date := (timezone('Africa/Nairobi', now()))::date;
  v_result jsonb;
begin
  select * into v_provider from public.providers
  where slug = p_slug and status = 'live';
  if not found then
    raise exception 'provider not found' using errcode = 'P0002';
  end if;

  select jsonb_build_object(
    'provider', jsonb_build_object(
      'id', v_provider.id,
      'slug', v_provider.slug,
      'name', v_provider.name,
      'area', v_provider.area,
      'kind', v_provider.kind,
      'class', v_provider.class,
      'payout_pct', v_provider.payout_pct,
      'payout_method', v_provider.payout_method,
      'owner_name', v_provider.owner_name,
      'rating', v_provider.rating,
      'review_count', v_provider.review_count,
      'hours', v_provider.hours,
      'home_visits', v_provider.home_visits,
      'about', v_provider.about,
      'kyc_docs', v_provider.kyc_docs,
      'verified', v_provider.verified
    ),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'category', s.category,
        'section', s.section,
        'cash_ksh', s.cash_ksh,
        'minutes', s.minutes,
        'active', s.active,
        'sort', s.sort,
        'image_url', s.image_url
      ) order by s.sort, s.name)
      from public.services s where s.provider_id = v_provider.id
    ), '[]'::jsonb),
    'bookings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id,
        'scheduled_at', b.scheduled_at,
        'status', b.status,
        'coins', b.coins,
        'cash_ksh', b.cash_ksh,
        'payout_ksh', b.payout_ksh,
        'addons', b.addons,
        'created_at', b.created_at,
        'member_name', m.full_name,
        'member_tier', m.tier,
        'member_area', m.area,
        'services', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', s.id, 'name', s.name, 'minutes', s.minutes, 'cash_ksh', bi.cash_ksh, 'coins', bi.coins
          ))
          from public.booking_items bi
          join public.services s on s.id = bi.service_id
          where bi.booking_id = b.id
        ), '[]'::jsonb)
      ) order by b.scheduled_at)
      from public.bookings b
      join public.profiles m on m.id = b.member_profile_id
      where b.provider_id = v_provider.id
        and (timezone('Africa/Nairobi', b.scheduled_at))::date >= v_day - 14
    ), '[]'::jsonb),
    'reviews', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'author_name', r.author_name,
        'author_tier', r.author_tier,
        'rating', r.rating,
        'body', r.body,
        'created_at', r.created_at
      ) order by r.created_at desc)
      from public.reviews r where r.provider_id = v_provider.id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.demo_provider_portal(text) from public;
grant execute on function public.demo_provider_portal(text) to anon, authenticated;

create or replace function public.provider_check_in(
  p_pin text,
  p_provider_slug text default 'braid-bar-ngong-rd'
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pin text := trim(p_pin);
  v_provider_id uuid;
  v_booking public.bookings%rowtype;
  v_pin_row public.booking_pins%rowtype;
  v_member public.profiles%rowtype;
  v_day date := (timezone('Africa/Nairobi', now()))::date;
  v_services text;
  v_minutes int;
begin
  if v_pin !~ '^[0-9]{4}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  select id into v_provider_id from public.providers
  where slug = p_provider_slug and status = 'live';
  if v_provider_id is null then
    return jsonb_build_object('ok', false, 'error', 'provider');
  end if;

  select bp.* into v_pin_row
  from public.booking_pins bp
  join public.bookings b on b.id = bp.booking_id
  where bp.pin = v_pin
    and b.provider_id = v_provider_id
    and (timezone('Africa/Nairobi', b.scheduled_at))::date = v_day
    and b.status in ('booked', 'arriving')
  order by b.scheduled_at
  limit 1;

  if not found then
    select bp.* into v_pin_row
    from public.booking_pins bp
    join public.bookings b on b.id = bp.booking_id
    where bp.pin = v_pin
      and b.provider_id = v_provider_id
      and bp.updated_at < now() - interval '30 minutes'
    order by bp.updated_at desc
    limit 1;
    if found then
      select * into v_booking from public.bookings where id = v_pin_row.booking_id;
      select * into v_member from public.profiles where id = v_booking.member_profile_id;
      return jsonb_build_object(
        'ok', false,
        'error', 'expired',
        'member_name', v_member.full_name,
        'pin_time', to_char(timezone('Africa/Nairobi', v_pin_row.updated_at), 'HH24:MI')
      );
    end if;
    return jsonb_build_object('ok', false, 'error', 'wrong');
  end if;

  if v_pin_row.updated_at < now() - interval '30 minutes' then
    select * into v_booking from public.bookings where id = v_pin_row.booking_id;
    select * into v_member from public.profiles where id = v_booking.member_profile_id;
    return jsonb_build_object(
      'ok', false,
      'error', 'expired',
      'member_name', v_member.full_name,
      'pin_time', to_char(timezone('Africa/Nairobi', v_pin_row.updated_at), 'HH24:MI')
    );
  end if;

  select * into v_booking from public.bookings where id = v_pin_row.booking_id;
  select * into v_member from public.profiles where id = v_booking.member_profile_id;
  select string_agg(s.name, ', '), coalesce(sum(s.minutes), 0)
    into v_services, v_minutes
  from public.booking_items bi
  join public.services s on s.id = bi.service_id
  where bi.booking_id = v_booking.id;

  return jsonb_build_object(
    'ok', true,
    'booking_id', v_booking.id,
    'member_name', v_member.full_name,
    'member_tier', v_member.tier,
    'services', v_services,
    'minutes', v_minutes,
    'scheduled_at', v_booking.scheduled_at,
    'payout_ksh', v_booking.payout_ksh,
    'status', v_booking.status
  );
end;
$$;

revoke all on function public.provider_check_in(text, text) from public;
grant execute on function public.provider_check_in(text, text) to anon, authenticated;

create or replace function public.provider_start_visit(
  p_booking_id uuid,
  p_provider_slug text default 'braid-bar-ngong-rd'
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider_id uuid;
  v_booking public.bookings%rowtype;
  v_member public.profiles%rowtype;
  v_services text;
begin
  select id into v_provider_id from public.providers
  where slug = p_provider_slug and status = 'live';
  if v_provider_id is null then
    raise exception 'provider not found' using errcode = 'P0002';
  end if;

  select * into v_booking from public.bookings
  where id = p_booking_id and provider_id = v_provider_id
    and status in ('booked', 'arriving');
  if not found then
    raise exception 'booking not startable' using errcode = 'P0001';
  end if;

  update public.bookings set status = 'in_progress' where id = v_booking.id;

  update public.wallets w set
    on_hold = greatest(0, on_hold - v_booking.coins),
    updated_at = now()
  where w.profile_id = v_booking.member_profile_id;

  insert into public.coin_transactions (profile_id, booking_id, kind, coins, note)
  values (
    v_booking.member_profile_id,
    v_booking.id,
    'release',
    0,
    'Released to provider on check-in'
  );

  select * into v_member from public.profiles where id = v_booking.member_profile_id;
  select string_agg(s.name, ', ') into v_services
  from public.booking_items bi
  join public.services s on s.id = bi.service_id
  where bi.booking_id = v_booking.id;

  return jsonb_build_object(
    'ok', true,
    'booking_id', v_booking.id,
    'member_name', v_member.full_name,
    'services', v_services,
    'payout_ksh', v_booking.payout_ksh,
    'checked_in_at', timezone('Africa/Nairobi', now())
  );
end;
$$;

revoke all on function public.provider_start_visit(uuid, text) from public;
grant execute on function public.provider_start_visit(uuid, text) to anon, authenticated;

create or replace function public.provider_mark_no_show(
  p_booking_id uuid,
  p_provider_slug text default 'braid-bar-ngong-rd'
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider_id uuid;
  v_booking public.bookings%rowtype;
  v_half int;
begin
  select id into v_provider_id from public.providers
  where slug = p_provider_slug and status = 'live';
  if v_provider_id is null then
    raise exception 'provider not found' using errcode = 'P0002';
  end if;

  select * into v_booking from public.bookings
  where id = p_booking_id and provider_id = v_provider_id
    and status in ('booked', 'arriving');
  if not found then
    raise exception 'booking not markable' using errcode = 'P0001';
  end if;

  v_half := round(v_booking.payout_ksh * 0.5);

  update public.bookings
  set status = 'no_show', payout_ksh = v_half
  where id = v_booking.id;

  update public.wallets w set
    on_hold = greatest(0, on_hold - v_booking.coins),
    available = available + (v_booking.coins - round(v_booking.coins * 0.5)),
    updated_at = now()
  where w.profile_id = v_booking.member_profile_id;

  insert into public.coin_transactions (profile_id, booking_id, kind, coins, note)
  values (
    v_booking.member_profile_id,
    v_booking.id,
    'refund',
    (v_booking.coins - round(v_booking.coins * 0.5))::integer,
    'Half refund after no-show'
  );

  return jsonb_build_object('ok', true, 'payout_ksh', v_half, 'booking_id', v_booking.id);
end;
$$;

revoke all on function public.provider_mark_no_show(uuid, text) from public;
grant execute on function public.provider_mark_no_show(uuid, text) to anon, authenticated;

insert into public.services (provider_id, name, category, section, cash_ksh, minutes, sort)
select p.id, v.name, v.category, v.section, v.cash_ksh, v.minutes, v.sort
from public.providers p
cross join (values
  ('Cornrows, straight back', 'braids-locs', 'Braids', 2000, 120, 3),
  ('Braids takedown', 'braids-locs', 'Braids', 1000, 60, 4),
  ('Wash and treatment', 'hair', 'Hair', 1500, 45, 5),
  ('Kids cornrows', 'braids-locs', 'Braids', 1200, 90, 6)
) as v(name, category, section, cash_ksh, minutes, sort)
where p.slug = 'braid-bar-ngong-rd'
  and not exists (
    select 1 from public.services s
    where s.provider_id = p.id and s.name = v.name
  );
