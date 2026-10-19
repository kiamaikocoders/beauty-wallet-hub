create or replace function public.list_booking_messages(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() and not exists (
    select 1 from public.bookings b
    where b.id = p_booking_id
      and b.id in (select private.visible_booking_ids())
  ) then
    raise exception 'not found' using errcode = 'P0002';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', m.id,
      'body', m.body,
      'created_at', m.created_at,
      'mine', m.sender_profile_id = private.current_profile_id(),
      'sender', pr.full_name
    ) order by m.created_at)
    from public.booking_messages m
    join public.profiles pr on pr.id = m.sender_profile_id
    where m.booking_id = p_booking_id
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.list_booking_messages(uuid) from public;
grant execute on function public.list_booking_messages(uuid) to authenticated;

create or replace function public.post_booking_message(p_booking_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sender uuid := private.current_profile_id();
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
begin
  if v_sender is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if char_length(v_body) < 1 or char_length(v_body) > 1000 then
    raise exception 'invalid message';
  end if;
  if not exists (
    select 1 from public.bookings b
    where b.id = p_booking_id
      and b.id in (select private.visible_booking_ids())
  ) then
    raise exception 'not found' using errcode = 'P0002';
  end if;
  insert into public.booking_messages (booking_id, sender_profile_id, body)
  values (p_booking_id, v_sender, v_body)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.post_booking_message(uuid, text) from public;
grant execute on function public.post_booking_message(uuid, text) to authenticated;

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
  v_minutes integer;
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

  select coalesce(sum(s.minutes), 60)::int into v_minutes
  from public.booking_items bi
  join public.services s on s.id = bi.service_id
  where bi.booking_id = v_booking.id;

  update public.bookings
  set status = 'in_progress',
      started_at = now(),
      promised_minutes = v_minutes
  where id = v_booking.id;

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
    'checked_in_at', timezone('Africa/Nairobi', now()),
    'promised_minutes', v_minutes
  );
end;
$$;

create or replace function public.provider_complete_visit(
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
  v_elapsed integer;
  v_over integer;
begin
  select id into v_provider_id from public.providers
  where slug = p_provider_slug and status = 'live';
  if v_provider_id is null then
    raise exception 'provider not found' using errcode = 'P0002';
  end if;

  update public.bookings
  set status = 'done',
      ended_at = now()
  where id = p_booking_id
    and provider_id = v_provider_id
    and status = 'in_progress'
  returning * into v_booking;

  if not found then
    raise exception 'visit is not in progress' using errcode = 'P0001';
  end if;

  v_elapsed := greatest(0, floor(extract(epoch from (v_booking.ended_at - v_booking.started_at)) / 60))::int;
  v_over := v_elapsed - coalesce(v_booking.promised_minutes, 0);

  return jsonb_build_object(
    'ok', true,
    'elapsed_minutes', v_elapsed,
    'promised_minutes', coalesce(v_booking.promised_minutes, 0),
    'overrun_minutes', v_over
  );
end;
$$;

revoke all on function public.provider_complete_visit(uuid, text) from public;
grant execute on function public.provider_complete_visit(uuid, text) to anon, authenticated;
