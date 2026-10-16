-- Real accounts: phone on signup, demo plan activation, admin directory, HR signup on the signed-in user.
-- Payments stay simulated. activate_demo_plan grants coins without a processor.

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  new_profile_id uuid;
begin
  insert into public.profiles (user_id, full_name, email, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1), 'Member'),
    new.email,
    coalesce(new.phone, nullif(new.raw_user_meta_data ->> 'phone', ''))
  )
  returning id into new_profile_id;
  insert into public.wallets (profile_id) values (new_profile_id);
  return new;
end;
$$;

create or replace function public.activate_demo_plan(p_tier public.tier_id)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid;
  coins integer;
  price integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  select id into pid from public.profiles where user_id = (select auth.uid());
  if pid is null then
    raise exception 'Profile missing' using errcode = 'P0001';
  end if;
  select t.monthly_coins, t.price_ksh into coins, price
  from public.tiers t where t.id = p_tier;
  if coins is null then
    raise exception 'Unknown plan' using errcode = 'P0001';
  end if;

  update public.profiles
  set tier = p_tier,
      status = 'active',
      renews_on = (current_date + interval '1 month')::date
  where id = pid;

  update public.wallets
  set available = available + coins,
      updated_at = now()
  where profile_id = pid;

  insert into public.coin_transactions (profile_id, kind, coins, note)
  values (pid, 'allowance', coins, 'Demo subscription · ' || p_tier::text || ' plan');

  return json_build_object('ok', true, 'coins', coins, 'priceKsh', price);
end;
$$;
revoke all on function public.activate_demo_plan(public.tier_id) from public;
grant execute on function public.activate_demo_plan(public.tier_id) to authenticated;

create or replace function public.admin_directory()
returns json
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  return json_build_object(
    'stats', json_build_object(
      'members', (select count(*) from public.profiles where role = 'member'),
      'providers', (select count(*) from public.providers),
      'liveProviders', (select count(*) from public.providers where status = 'live'),
      'applications', (select count(*) from public.providers where status = 'applied'),
      'bookingsThisMonth', (
        select count(*) from public.bookings where created_at >= date_trunc('month', now())
      ),
      'coinsOutstanding', (select coalesce(sum(available), 0) from public.wallets)
    ),
    'members', coalesce((
      select json_agg(json_build_object(
        'id', p.id,
        'name', p.full_name,
        'area', coalesce(p.area, '—'),
        'plan', coalesce(p.tier::text, 'basic'),
        'available', coalesce(w.available, 0),
        'onHold', coalesce(w.on_hold, 0),
        'visits', (select count(*) from public.bookings b where b.member_profile_id = p.id),
        'renews', coalesce(to_char(p.renews_on, 'DD Mon'), '—'),
        'status', p.status::text,
        'email', p.email
      ) order by p.created_at desc)
      from public.profiles p
      left join public.wallets w on w.profile_id = p.id
      where p.role = 'member'
    ), '[]'::json),
    'providers', coalesce((
      select json_agg(json_build_object(
        'slug', pr.slug,
        'name', pr.name,
        'area', pr.area,
        'class', pr.class::text,
        'payout', (round(pr.payout_pct * 100)::text || '%'),
        'rating', coalesce(pr.rating, 0),
        'visits', (select count(*) from public.bookings b where b.provider_id = pr.id),
        'status', pr.status::text
      ) order by pr.name)
      from public.providers pr
    ), '[]'::json)
  );
end;
$$;
revoke all on function public.admin_directory() from public;
grant execute on function public.admin_directory() to authenticated;

create or replace function public.teams_signup_company(
  p_company_name text,
  p_hr_name text,
  p_phone text,
  p_work_email text
)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  cid uuid;
  pid uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if length(trim(p_company_name)) < 2 then
    raise exception 'Company name required' using errcode = 'P0001';
  end if;

  select id into pid from public.profiles where user_id = (select auth.uid());
  if pid is null then
    raise exception 'Profile missing' using errcode = 'P0001';
  end if;

  update public.profiles
  set full_name = trim(p_hr_name),
      email = lower(trim(p_work_email)),
      phone = trim(p_phone),
      role = 'hr'
  where id = pid;

  select c.id into cid
  from public.companies c
  where c.owner_profile_id = pid
  limit 1;

  if cid is null then
    insert into public.companies (name, billing_email, hr_email, phone, owner_profile_id, mpesa_phone)
    values (
      trim(p_company_name),
      lower(trim(p_work_email)),
      lower(trim(p_work_email)),
      trim(p_phone),
      pid,
      trim(p_phone)
    )
    returning id into cid;

    insert into public.company_admins (company_id, profile_id, title, is_owner)
    values (cid, pid, 'HR manager', true);
  end if;

  return json_build_object('company_id', cid, 'profile_id', pid);
end;
$$;
revoke all on function public.teams_signup_company(text, text, text, text) from public, anon;
grant execute on function public.teams_signup_company(text, text, text, text) to authenticated;
