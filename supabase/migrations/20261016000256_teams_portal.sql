-- Teams (HR) portal: companies, seats, invites, invoices.
-- Writes via SECURITY DEFINER RPCs; RLS on, no anon policies.

create type public.company_seat_status as enum ('active', 'invited', 'leaving', 'ended');
create type public.company_invoice_status as enum ('draft', 'due', 'paid', 'overdue');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  billing_email text not null,
  hr_email text not null,
  phone text not null,
  address text,
  owner_profile_id uuid references public.profiles (id) on delete set null,
  mpesa_phone text,
  card_last4 text,
  auto_pay boolean not null default true,
  staff_can_top_up boolean not null default true,
  remind_unbooked boolean not null default true,
  weekly_summary boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.company_admins (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  is_owner boolean not null default false,
  unique (company_id, profile_id)
);

create table public.company_seats (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  tier public.tier_id not null,
  status public.company_seat_status not null default 'invited',
  member_profile_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  phone text not null,
  team_name text,
  coins_used integer not null default 0,
  coins_allowance integer not null default 0,
  invite_code text unique,
  invited_at timestamptz,
  leaving_on date,
  pending_tier public.tier_id,
  created_at timestamptz not null default now()
);
create index company_seats_company_idx on public.company_seats (company_id);

create table public.company_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  seat_id uuid references public.company_seats (id) on delete set null,
  code text not null unique,
  full_name text not null,
  phone text not null,
  tier public.tier_id not null,
  message text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create table public.company_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  number text not null unique,
  period_label text not null,
  seats integer not null,
  amount_ksh integer not null check (amount_ksh >= 0),
  paid_with text,
  status public.company_invoice_status not null default 'due',
  due_on date not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index company_invoices_company_idx on public.company_invoices (company_id);

alter table public.companies enable row level security;
alter table public.company_admins enable row level security;
alter table public.company_seats enable row level security;
alter table public.company_invites enable row level security;
alter table public.company_invoices enable row level security;

revoke all on table public.companies from anon, authenticated;
revoke all on table public.company_admins from anon, authenticated;
revoke all on table public.company_seats from anon, authenticated;
revoke all on table public.company_invites from anon, authenticated;
revoke all on table public.company_invoices from anon, authenticated;
grant select, insert, update, delete on table public.companies to service_role;
grant select, insert, update, delete on table public.company_admins to service_role;
grant select, insert, update, delete on table public.company_seats to service_role;
grant select, insert, update, delete on table public.company_invites to service_role;
grant select, insert, update, delete on table public.company_invoices to service_role;

create or replace function private.resolve_hr_company_id()
returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  cid uuid;
begin
  select ca.company_id into cid
  from public.company_admins ca
  join public.profiles p on p.id = ca.profile_id
  where p.user_id = (select auth.uid())
  limit 1;
  return cid;
end;
$$;
revoke all on function private.resolve_hr_company_id() from public;

create or replace function public.teams_company_overview()
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  cid uuid := private.resolve_hr_company_id();
  c public.companies%rowtype;
  seats_count int;
  active_count int;
  invited_count int;
begin
  if cid is null then
    return null;
  end if;
  select * into c from public.companies where id = cid;
  select count(*) into seats_count from public.company_seats where company_id = cid;
  select count(*) into active_count from public.company_seats where company_id = cid and status = 'active';
  select count(*) into invited_count from public.company_seats where company_id = cid and status = 'invited';
  return json_build_object(
    'company', json_build_object(
      'id', c.id,
      'name', c.name,
      'billing_email', c.billing_email,
      'hr_email', c.hr_email,
      'phone', c.phone,
      'address', c.address
    ),
    'seats', seats_count,
    'active', active_count,
    'invited', invited_count
  );
end;
$$;
revoke all on function public.teams_company_overview() from public;
grant execute on function public.teams_company_overview() to authenticated;

create or replace function public.teams_list_seats()
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  cid uuid := private.resolve_hr_company_id();
begin
  if cid is null then
    return '[]'::json;
  end if;
  return coalesce((
    select json_agg(json_build_object(
      'id', s.id,
      'full_name', s.full_name,
      'phone', s.phone,
      'team_name', s.team_name,
      'tier', s.tier,
      'status', s.status,
      'coins_used', s.coins_used,
      'coins_allowance', s.coins_allowance,
      'leaving_on', s.leaving_on,
      'invited_at', s.invited_at,
      'pending_tier', s.pending_tier
    ) order by s.full_name)
    from public.company_seats s
    where s.company_id = cid
  ), '[]'::json);
end;
$$;
revoke all on function public.teams_list_seats() from public;
grant execute on function public.teams_list_seats() to authenticated;

create or replace function public.teams_list_invoices()
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  cid uuid := private.resolve_hr_company_id();
begin
  if cid is null then
    return '[]'::json;
  end if;
  return coalesce((
    select json_agg(json_build_object(
      'id', i.id,
      'number', i.number,
      'period_label', i.period_label,
      'seats', i.seats,
      'amount_ksh', i.amount_ksh,
      'paid_with', i.paid_with,
      'status', i.status,
      'due_on', i.due_on,
      'paid_at', i.paid_at
    ) order by i.due_on desc)
    from public.company_invoices i
    where i.company_id = cid
  ), '[]'::json);
end;
$$;
revoke all on function public.teams_list_invoices() from public;
grant execute on function public.teams_list_invoices() to authenticated;

create or replace function public.teams_invite_seat(
  p_full_name text,
  p_phone text,
  p_tier public.tier_id,
  p_team_name text default null
)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  cid uuid := private.resolve_hr_company_id();
  code text;
  seat_id uuid;
  inv_id uuid;
  allowance int;
begin
  if cid is null then
    raise exception 'Not an HR admin' using errcode = '42501';
  end if;
  if length(trim(p_full_name)) < 2 then
    raise exception 'Name required' using errcode = 'P0001';
  end if;
  if length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 9 then
    raise exception 'Phone required' using errcode = 'P0001';
  end if;

  select monthly_coins into allowance from public.tiers where id = p_tier;
  code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.company_seats (
    company_id, tier, status, full_name, phone, team_name,
    coins_allowance, invite_code, invited_at
  ) values (
    cid, p_tier, 'invited', trim(p_full_name), trim(p_phone), nullif(trim(p_team_name), ''),
    coalesce(allowance, 0), code, now()
  ) returning id into seat_id;

  insert into public.company_invites (
    company_id, seat_id, code, full_name, phone, tier
  ) values (
    cid, seat_id, code, trim(p_full_name), trim(p_phone), p_tier
  ) returning id into inv_id;

  return json_build_object('seat_id', seat_id, 'invite_id', inv_id, 'code', code);
end;
$$;
revoke all on function public.teams_invite_seat(text, text, public.tier_id, text) from public;
grant execute on function public.teams_invite_seat(text, text, public.tier_id, text) to authenticated;

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
  if length(trim(p_company_name)) < 2 then
    raise exception 'Company name required' using errcode = 'P0001';
  end if;
  if position('@' in coalesce(p_work_email, '')) = 0 then
    raise exception 'Work email required' using errcode = 'P0001';
  end if;
  if length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 9 then
    raise exception 'Phone required' using errcode = 'P0001';
  end if;

  insert into public.profiles (full_name, email, phone, role)
  values (trim(p_hr_name), lower(trim(p_work_email)), trim(p_phone), 'hr')
  returning id into pid;

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

  return json_build_object('company_id', cid, 'profile_id', pid);
end;
$$;
revoke all on function public.teams_signup_company(text, text, text, text) from public;
grant execute on function public.teams_signup_company(text, text, text, text) to anon, authenticated;

create or replace function public.teams_accept_invite(
  p_code text,
  p_phone text
)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  inv public.company_invites%rowtype;
  seat public.company_seats%rowtype;
  pid uuid;
begin
  select * into inv from public.company_invites
  where code = lower(trim(p_code)) and accepted_at is null
  limit 1;
  if inv.id is null then
    raise exception 'Invite not found' using errcode = 'P0001';
  end if;
  if regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
     <> regexp_replace(inv.phone, '\D', '', 'g') then
    raise exception 'Phone does not match invite' using errcode = 'P0001';
  end if;

  insert into public.profiles (full_name, phone, role, tier, status)
  values (inv.full_name, trim(p_phone), 'member', inv.tier, 'active')
  returning id into pid;

  update public.company_seats
  set status = 'active', member_profile_id = pid
  where id = inv.seat_id
  returning * into seat;

  update public.company_invites set accepted_at = now() where id = inv.id;

  return json_build_object(
    'seat_id', seat.id,
    'profile_id', pid,
    'tier', inv.tier,
    'company_id', inv.company_id
  );
end;
$$;
revoke all on function public.teams_accept_invite(text, text) from public;
grant execute on function public.teams_accept_invite(text, text) to anon, authenticated;

create or replace function public.teams_get_invite(p_code text)
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  inv public.company_invites%rowtype;
  cname text;
begin
  select * into inv from public.company_invites
  where code = lower(trim(p_code))
  limit 1;
  if inv.id is null then
    return null;
  end if;
  select name into cname from public.companies where id = inv.company_id;
  return json_build_object(
    'code', inv.code,
    'full_name', inv.full_name,
    'phone', inv.phone,
    'tier', inv.tier,
    'message', inv.message,
    'company_name', cname,
    'accepted', inv.accepted_at is not null
  );
end;
$$;
revoke all on function public.teams_get_invite(text) from public;
grant execute on function public.teams_get_invite(text) to anon, authenticated;
