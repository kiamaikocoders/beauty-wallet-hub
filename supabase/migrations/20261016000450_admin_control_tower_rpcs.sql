-- Admin Control Tower RPCs. Every write checks private.is_admin().

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  action text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
drop policy if exists "Admins read audit log" on public.admin_audit_log;
create policy "Admins read audit log" on public.admin_audit_log
  for select to authenticated using ((select private.is_admin()));

create table if not exists public.payout_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null unique,
  total_ksh integer not null default 0,
  providers_ready integer not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'pending_second', 'approved', 'sent')),
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.payout_runs enable row level security;
drop policy if exists "Admins manage payout runs" on public.payout_runs;
create policy "Admins manage payout runs" on public.payout_runs
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Separate from Teams `companies` (uuid). Admin demo keys are text slugs.
create table if not exists public.admin_company_state (
  id text primary key,
  name text not null,
  status text not null default 'active',
  seats integer not null default 0,
  monthly_ksh integer not null default 0,
  due_date date,
  coins_paused boolean not null default false,
  extend_reason text,
  created_at timestamptz not null default now()
);
alter table public.admin_company_state enable row level security;
drop policy if exists "Admins manage company state" on public.admin_company_state;
create policy "Admins manage company state" on public.admin_company_state
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

insert into public.payout_runs (run_date, total_ksh, providers_ready, status)
values ('2026-10-13', 2684300, 66, 'draft')
on conflict (run_date) do nothing;

insert into public.admin_company_state (id, name, status, seats, monthly_ksh, due_date, coins_paused)
values
  ('savannah', 'Savannah Logistics Ltd', 'active', 20, 246000, '2026-11-01', false),
  ('westlands-creative', 'Westlands Creative Studio', 'paused', 8, 56000, '2026-10-01', true)
on conflict (id) do nothing;

create or replace function private.require_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  pid uuid;
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  select id into pid from public.profiles where user_id = (select auth.uid()) limit 1;
  return pid;
end;
$$;

create or replace function public.admin_update_payout_band(
  p_class public.tier_id,
  p_min_pct numeric,
  p_max_pct numeric,
  p_default_pct numeric
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.require_admin();
begin
  if p_min_pct < 0 or p_max_pct > 1 or p_min_pct > p_max_pct
     or p_default_pct < p_min_pct or p_default_pct > p_max_pct then
    raise exception 'Invalid payout band' using errcode = '22023';
  end if;

  update public.payout_bands
  set min_pct = p_min_pct, max_pct = p_max_pct, default_pct = p_default_pct
  where class = p_class;

  insert into public.admin_audit_log (actor_profile_id, action, detail)
  values (actor, 'update_payout_band', json_build_object(
    'class', p_class, 'min', p_min_pct, 'max', p_max_pct, 'default', p_default_pct
  ));

  return json_build_object('ok', true);
end;
$$;
revoke all on function public.admin_update_payout_band(public.tier_id, numeric, numeric, numeric) from public;
grant execute on function public.admin_update_payout_band(public.tier_id, numeric, numeric, numeric) to authenticated;

create or replace function public.admin_adjust_coins(
  p_member_key text,
  p_coins integer,
  p_reason text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.require_admin();
  pid uuid;
  avail integer;
begin
  if p_coins = 0 or coalesce(trim(p_reason), '') = '' then
    raise exception 'Coins and reason required' using errcode = '22023';
  end if;

  select id into pid
  from public.profiles
  where role = 'member'
    and (
      id::text = p_member_key
      or lower(full_name) like '%' || lower(p_member_key) || '%'
      or lower(split_part(full_name, ' ', 1)) = lower(p_member_key)
    )
  order by created_at
  limit 1;

  if pid is null then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  update public.wallets
  set available = available + p_coins, updated_at = now()
  where profile_id = pid
    and available + p_coins >= 0
  returning available into avail;

  if avail is null then
    raise exception 'Insufficient coins or missing wallet' using errcode = '22023';
  end if;

  insert into public.coin_transactions (profile_id, kind, coins, note)
  values (pid, 'adjustment', p_coins, p_reason);

  insert into public.admin_audit_log (actor_profile_id, action, detail)
  values (actor, 'adjust_coins', json_build_object(
    'member', pid, 'coins', p_coins, 'reason', p_reason, 'available', avail
  ));

  return json_build_object('ok', true, 'available', avail);
end;
$$;
revoke all on function public.admin_adjust_coins(text, integer, text) from public;
grant execute on function public.admin_adjust_coins(text, integer, text) to authenticated;

create or replace function public.admin_approve_payout_run(
  p_run_date date,
  p_code text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.require_admin();
  run public.payout_runs%rowtype;
  next_status text;
begin
  if coalesce(trim(p_code), '') = '' or length(regexp_replace(p_code, '\s', '', 'g')) < 3 then
    raise exception 'Authenticator code required' using errcode = '22023';
  end if;

  select * into run from public.payout_runs where run_date = p_run_date for update;
  if not found then
    insert into public.payout_runs (run_date, total_ksh, providers_ready, status)
    values (p_run_date, 2684300, 66, 'draft')
    returning * into run;
  end if;

  if run.total_ksh > 500000 and run.status = 'draft' then
    next_status := 'pending_second';
  else
    next_status := 'approved';
  end if;

  update public.payout_runs
  set status = next_status, approved_by = actor, approved_at = now()
  where id = run.id;

  insert into public.admin_audit_log (actor_profile_id, action, detail)
  values (actor, 'approve_payout_run', json_build_object(
    'run_date', p_run_date, 'status', next_status
  ));

  return json_build_object('ok', true, 'status', next_status);
end;
$$;
revoke all on function public.admin_approve_payout_run(date, text) from public;
grant execute on function public.admin_approve_payout_run(date, text) to authenticated;

create or replace function public.admin_resolve_dispute(
  p_code text,
  p_decision text,
  p_note text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.require_admin();
begin
  if p_decision not in ('redo', 'half', 'full') then
    raise exception 'Invalid decision' using errcode = '22023';
  end if;

  update public.disputes
  set status = 'resolved',
      outcome = case p_decision
        when 'redo' then 'redo'
        when 'half' then 'half_refund'
        else 'full_refund'
      end,
      resolution_note = coalesce(p_note, resolution_note),
      resolved_at = coalesce(resolved_at, now())
  where code = p_code;

  insert into public.admin_audit_log (actor_profile_id, action, detail)
  values (actor, 'resolve_dispute', json_build_object(
    'code', p_code, 'decision', p_decision, 'note', p_note
  ));

  return json_build_object('ok', true);
end;
$$;
revoke all on function public.admin_resolve_dispute(text, text, text) from public;
grant execute on function public.admin_resolve_dispute(text, text, text) to authenticated;

create or replace function public.admin_extend_company_due_date(
  p_company_id text,
  p_due_date text,
  p_resume_coins boolean,
  p_reason text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.require_admin();
  parsed date;
begin
  begin
    parsed := p_due_date::date;
  exception when others then
    parsed := date '2026-10-23';
  end;

  insert into public.admin_company_state (id, name, status, seats, monthly_ksh, due_date, coins_paused, extend_reason)
  values (p_company_id, p_company_id, 'active', 0, 0, parsed, not p_resume_coins, p_reason)
  on conflict (id) do update
  set due_date = excluded.due_date,
      coins_paused = not p_resume_coins,
      status = case when p_resume_coins then 'active' else admin_company_state.status end,
      extend_reason = p_reason;

  insert into public.admin_audit_log (actor_profile_id, action, detail)
  values (actor, 'extend_company_due_date', json_build_object(
    'company', p_company_id, 'due_date', parsed, 'resume', p_resume_coins, 'reason', p_reason
  ));

  return json_build_object('ok', true);
end;
$$;
revoke all on function public.admin_extend_company_due_date(text, text, boolean, text) from public;
grant execute on function public.admin_extend_company_due_date(text, text, boolean, text) to authenticated;

create or replace function public.admin_review_provider(
  p_slug text,
  p_decision text,
  p_class public.tier_id default null,
  p_payout_pct numeric default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.require_admin();
  new_status public.provider_status;
begin
  if p_decision not in ('approve', 'reject', 'ask_changes') then
    raise exception 'Invalid decision' using errcode = '22023';
  end if;

  new_status := case p_decision
    when 'approve' then 'live'::public.provider_status
    when 'reject' then 'rejected'::public.provider_status
    else 'applied'::public.provider_status
  end;

  update public.providers
  set status = new_status,
      verified = (p_decision = 'approve'),
      class = coalesce(p_class, class),
      payout_pct = coalesce(p_payout_pct, payout_pct)
  where slug = p_slug;

  insert into public.admin_audit_log (actor_profile_id, action, detail)
  values (actor, 'review_provider', json_build_object(
    'slug', p_slug, 'decision', p_decision, 'class', p_class, 'payout_pct', p_payout_pct
  ));

  return json_build_object('ok', true);
end;
$$;
revoke all on function public.admin_review_provider(text, text, public.tier_id, numeric) from public;
grant execute on function public.admin_review_provider(text, text, public.tier_id, numeric) to authenticated;
