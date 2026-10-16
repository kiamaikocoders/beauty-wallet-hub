create or replace function public.member_rate_booking(
  p_booking_id uuid,
  p_rating smallint,
  p_body text default null,
  p_tags text[] default '{}',
  p_demo text default null
)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid := private.resolve_member_id(p_demo);
  b record;
  mem record;
  rid uuid;
begin
  if pid is null then
    raise exception 'Sign in required' using errcode = 'P0001';
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be 1–5' using errcode = 'P0001';
  end if;

  select b.*, pr.id as provider_id into b
  from public.bookings b join public.providers pr on pr.id = b.provider_id
  where b.id = p_booking_id and b.member_profile_id = pid and b.status = 'done';
  if b.id is null then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if exists(select 1 from public.reviews r where r.booking_id = b.id) then
    raise exception 'Already rated' using errcode = 'P0001';
  end if;

  select * into mem from public.profiles where id = pid;
  insert into public.reviews (provider_id, booking_id, author_profile_id, author_name, author_tier, rating, body)
  values (
    b.provider_id, b.id, pid, split_part(mem.full_name, ' ', 1) || ' ' || left(split_part(mem.full_name, ' ', 2), 1) || '.',
    mem.tier, p_rating,
    trim(both from coalesce(p_body, '') || case when coalesce(array_length(p_tags, 1), 0) > 0 then E'\n[' || array_to_string(p_tags, ', ') || ']' else '' end)
  )
  returning id into rid;

  update public.providers pr set
    review_count = pr.review_count + 1,
    rating = round(((coalesce(pr.rating, 0) * pr.review_count + p_rating) / (pr.review_count + 1))::numeric, 1)
  where pr.id = b.provider_id;

  return json_build_object('id', rid, 'rating', p_rating);
end;
$$;
revoke all on function public.member_rate_booking(uuid, smallint, text, text[], text) from public;
grant execute on function public.member_rate_booking(uuid, smallint, text, text[], text) to anon, authenticated;

create or replace function public.member_report_problem(
  p_booking_id uuid,
  p_reason text,
  p_message text,
  p_demo text default null
)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid := private.resolve_member_id(p_demo);
  did uuid;
  code text;
begin
  if pid is null then
    raise exception 'Sign in required' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.bookings b where b.id = p_booking_id and b.member_profile_id = pid) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if length(trim(p_reason)) < 3 or length(trim(p_message)) < 5 then
    raise exception 'Tell us more' using errcode = 'P0001';
  end if;

  insert into public.disputes (booking_id, raised_by_profile_id, reason, member_message, status)
  values (p_booking_id, pid, trim(p_reason), trim(p_message), 'new')
  returning id, code into did, code;

  return json_build_object('id', did, 'code', code);
end;
$$;
revoke all on function public.member_report_problem(uuid, text, text, text) from public;
grant execute on function public.member_report_problem(uuid, text, text, text) to anon, authenticated;

create or replace function public.member_top_up(
  p_coins integer,
  p_method text default 'mpesa',
  p_phone text default null,
  p_demo text default null
)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid := private.resolve_member_id(p_demo);
  rules public.coin_rules;
  avail int;
begin
  if pid is null then
    raise exception 'Sign in required' using errcode = 'P0001';
  end if;
  if p_coins not in (100, 250, 500, 1000) then
    raise exception 'Pick a coin pack' using errcode = 'P0001';
  end if;

  select * into rules from public.coin_rules where id = 1;

  update public.wallets
  set available = available + p_coins, updated_at = now()
  where profile_id = pid
  returning available into avail;

  insert into public.coin_transactions (profile_id, kind, coins, note)
  values (
    pid, 'top_up', p_coins,
    case when lower(coalesce(p_method, 'mpesa')) = 'card' then 'Card'
         else 'M-Pesa ' || coalesce(nullif(trim(p_phone), ''), '0712 345 678') end
      || ' Ksh ' || (p_coins * rules.ksh_per_coin)::text
  );

  return json_build_object(
    'coins', p_coins,
    'priceKsh', p_coins * rules.ksh_per_coin,
    'available', avail,
    'method', coalesce(p_method, 'mpesa')
  );
end;
$$;
revoke all on function public.member_top_up(integer, text, text, text) from public;
grant execute on function public.member_top_up(integer, text, text, text) to anon, authenticated;
