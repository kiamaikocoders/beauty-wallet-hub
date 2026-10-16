-- Member app RPCs: demo profile resolution, booking, cancel, rate, top-up.
-- Writes go through SECURITY DEFINER; tables stay without anon write policies.

create or replace function private.resolve_member_id(p_demo text default null)
returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  pid uuid;
  key text := lower(trim(coalesce(p_demo, '')));
begin
  select id into pid from public.profiles where user_id = (select auth.uid());
  if pid is not null then
    return pid;
  end if;
  if key = '' then
    return null;
  end if;
  if key in ('amani', 'amani-wanjiru') then
    select id into pid from public.profiles where full_name = 'Amani Wanjiru' and role = 'member' limit 1;
  elsif key in ('brian', 'brian-otieno') then
    select id into pid from public.profiles where full_name = 'Brian Otieno' and role = 'member' limit 1;
  else
    raise exception 'Unknown demo member' using errcode = 'P0001';
  end if;
  return pid;
end;
$$;
revoke all on function private.resolve_member_id(text) from public;

create or replace function public.member_session(p_demo text default null)
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  pid uuid := private.resolve_member_id(p_demo);
  row record;
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
    'avatarUrl', coalesce(row.avatar_url, '/images/people/amani-wanjiru.png'),
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
revoke all on function public.member_session(text) from public;
grant execute on function public.member_session(text) to anon, authenticated;
