-- Live command-center records: gifts, staff, documents, visits, search, health, and studio writes.
-- Payment collection and SMS stay out. Finance figures are visit value, not money received.

alter type public.member_status add value if not exists 'paused';

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  from_name text not null,
  from_email text,
  to_name text not null,
  to_phone text,
  to_email text,
  message text,
  tier public.tier_id not null,
  coins integer not null,
  price_ksh integer not null,
  status text not null default 'waiting' check (status in ('waiting', 'scheduled', 'claimed', 'expired')),
  claim_by date not null,
  arrive_on date,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.gifts enable row level security;
drop policy if exists "Admins read gifts" on public.gifts;
create policy "Admins read gifts" on public.gifts
  for select to authenticated using ((select private.is_admin()));

create table if not exists public.provider_staff (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  name text not null,
  role text not null default 'Stylist',
  works text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.provider_staff enable row level security;
drop policy if exists "Admins read staff" on public.provider_staff;
create policy "Admins read staff" on public.provider_staff
  for select to authenticated using ((select private.is_admin()));
drop policy if exists "Owners read staff" on public.provider_staff;
create policy "Owners read staff" on public.provider_staff
  for select to authenticated using (provider_id in (select private.owned_provider_ids()));

create table if not exists public.provider_documents (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  label text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);
alter table public.provider_documents enable row level security;
drop policy if exists "Admins read provider documents" on public.provider_documents;
create policy "Admins read provider documents" on public.provider_documents
  for select to authenticated using ((select private.is_admin()));
drop policy if exists "Owners read provider documents" on public.provider_documents;
create policy "Owners read provider documents" on public.provider_documents
  for select to authenticated using (provider_id in (select private.owned_provider_ids()));

alter table public.providers
  add column if not exists visit_at timestamptz,
  add column if not exists visit_note text;

insert into storage.buckets (id, name, public)
values ('provider-docs', 'provider-docs', false)
on conflict (id) do nothing;

drop policy if exists "Provider docs read" on storage.objects;
create policy "Provider docs read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'provider-docs'
    and (
      (select private.is_admin())
      or (storage.foldername(name))[1] in (
        select p.id::text from public.providers p where p.id in (select private.owned_provider_ids())
      )
    )
  );

drop policy if exists "Provider docs insert" on storage.objects;
create policy "Provider docs insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'provider-docs'
    and (
      (select private.is_admin())
      or (storage.foldername(name))[1] in (
        select p.id::text from public.providers p where p.id in (select private.owned_provider_ids())
      )
    )
  );

create or replace function public.admin_set_member_status(p_id uuid, p_status text)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := private.require_admin();
  next_status public.member_status;
begin
  if p_status not in ('active', 'paused', 'cancelled', 'renewal_failed') then
    raise exception 'Invalid status' using errcode = '22023';
  end if;
  next_status := p_status::public.member_status;
  update public.profiles set status = next_status where id = p_id and role = 'member';
  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
  insert into public.admin_audit_log (actor_profile_id, action, detail)
  values (actor, 'set_member_status', json_build_object('member', p_id, 'status', p_status));
  return json_build_object('ok', true, 'status', p_status);
end;
$$;
revoke all on function public.admin_set_member_status(uuid, text) from public;
grant execute on function public.admin_set_member_status(uuid, text) to authenticated;

create or replace function public.create_gift(
  p_from_name text,
  p_from_email text,
  p_to_name text,
  p_to_phone text,
  p_to_email text,
  p_message text,
  p_tier text,
  p_arrive_on date
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_tier public.tier_id;
  v_coins integer;
  v_price integer;
  v_code text;
  v_id uuid;
  v_claim date;
begin
  if char_length(trim(coalesce(p_to_name, ''))) < 2 then
    raise exception 'Recipient name required';
  end if;
  begin
    v_tier := lower(trim(p_tier))::public.tier_id;
  exception when others then
    raise exception 'Unknown plan';
  end;
  select monthly_coins, price_ksh into v_coins, v_price from public.tiers where id = v_tier;
  v_code := 'BW-GFT-' || lpad(nextval('public.provider_application_ref_seq')::text, 4, '0');
  v_claim := coalesce(p_arrive_on, current_date) + 30;
  insert into public.gifts (
    code, from_name, from_email, to_name, to_phone, to_email, message, tier, coins, price_ksh, status, claim_by, arrive_on
  ) values (
    v_code,
    coalesce(nullif(trim(p_from_name), ''), 'Someone'),
    nullif(trim(coalesce(p_from_email, '')), ''),
    trim(p_to_name),
    nullif(trim(coalesce(p_to_phone, '')), ''),
    nullif(trim(coalesce(p_to_email, '')), ''),
    nullif(trim(coalesce(p_message, '')), ''),
    v_tier, v_coins, v_price,
    case when p_arrive_on is not null and p_arrive_on > current_date then 'scheduled' else 'waiting' end,
    v_claim,
    p_arrive_on
  ) returning id into v_id;
  return jsonb_build_object('id', v_id, 'code', v_code, 'coins', v_coins, 'claimBy', v_claim);
end;
$$;
revoke all on function public.create_gift(text, text, text, text, text, text, text, date) from public;
grant execute on function public.create_gift(text, text, text, text, text, text, text, date) to anon, authenticated;

create or replace function private.provider_id_for(p_slug text)
returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  pid uuid;
begin
  select p.id into pid
  from public.providers p
  where p.slug = p_slug
    and (
      (select private.is_admin())
      or p.id in (select private.owned_provider_ids())
    );
  if pid is null then
    raise exception 'Studio not found' using errcode = '42501';
  end if;
  return pid;
end;
$$;
revoke all on function private.provider_id_for(text) from public, anon, authenticated;

create or replace function public.provider_save_service(
  p_slug text,
  p_id uuid,
  p_name text,
  p_category text,
  p_cash integer,
  p_minutes integer,
  p_active boolean
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid := private.provider_id_for(p_slug);
  v_category text := coalesce(nullif(trim(p_category), ''), 'hair');
  sid uuid;
begin
  if char_length(trim(p_name)) < 2 or p_cash < 100 or p_minutes < 10 then
    raise exception 'Name, price and time are required';
  end if;
  if not exists (select 1 from public.categories c where c.slug = v_category) then
    v_category := 'hair';
  end if;
  if p_id is null then
    insert into public.services (provider_id, name, category, cash_ksh, minutes, active)
    values (pid, trim(p_name), v_category, p_cash, p_minutes, coalesce(p_active, true))
    returning id into sid;
  else
    update public.services
    set name = trim(p_name), category = v_category, cash_ksh = p_cash, minutes = p_minutes, active = coalesce(p_active, active)
    where id = p_id and provider_id = pid
    returning id into sid;
    if sid is null then
      raise exception 'Service not found';
    end if;
  end if;
  return jsonb_build_object('id', sid);
end;
$$;
revoke all on function public.provider_save_service(text, uuid, text, text, integer, integer, boolean) from public;
grant execute on function public.provider_save_service(text, uuid, text, text, integer, integer, boolean) to authenticated;

create or replace function public.provider_save_staff(
  p_slug text,
  p_id uuid,
  p_name text,
  p_role text,
  p_works text,
  p_active boolean
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid := private.provider_id_for(p_slug);
  sid uuid;
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'Name required';
  end if;
  if p_id is null then
    insert into public.provider_staff (provider_id, name, role, works, active)
    values (pid, trim(p_name), coalesce(nullif(trim(p_role), ''), 'Stylist'), nullif(trim(coalesce(p_works, '')), ''), coalesce(p_active, true))
    returning id into sid;
  else
    update public.provider_staff
    set name = trim(p_name),
        role = coalesce(nullif(trim(p_role), ''), role),
        works = nullif(trim(coalesce(p_works, '')), ''),
        active = coalesce(p_active, active)
    where id = p_id and provider_id = pid
    returning id into sid;
  end if;
  return jsonb_build_object('id', sid);
end;
$$;
revoke all on function public.provider_save_staff(text, uuid, text, text, text, boolean) from public;
grant execute on function public.provider_save_staff(text, uuid, text, text, text, boolean) to authenticated;

create or replace function public.provider_staff_list(p_slug text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  pid uuid := private.provider_id_for(p_slug);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id, 'name', s.name, 'role', s.role, 'works', s.works, 'active', s.active
    ) order by s.name)
    from public.provider_staff s where s.provider_id = pid
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.provider_staff_list(text) from public;
grant execute on function public.provider_staff_list(text) to authenticated;

create or replace function public.provider_save_hours(p_slug text, p_hours jsonb)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid := private.provider_id_for(p_slug);
begin
  update public.providers set hours = coalesce(p_hours, '[]'::jsonb) where id = pid;
  return json_build_object('ok', true);
end;
$$;
revoke all on function public.provider_save_hours(text, jsonb) from public;
grant execute on function public.provider_save_hours(text, jsonb) to authenticated;

create or replace function public.attach_provider_document(p_slug text, p_label text, p_path text)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid := private.provider_id_for(p_slug);
begin
  if position(pid::text || '/' in p_path) <> 1 then
    raise exception 'Document path must stay in this studio folder';
  end if;
  insert into public.provider_documents (provider_id, label, storage_path)
  values (pid, left(trim(p_label), 80), p_path);
  return json_build_object('ok', true);
end;
$$;
revoke all on function public.attach_provider_document(text, text, text) from public;
grant execute on function public.attach_provider_document(text, text, text) to authenticated;

create or replace function public.admin_schedule_visit(p_slug text, p_at timestamptz, p_note text)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := private.require_admin();
begin
  update public.providers
  set visit_at = p_at, visit_note = nullif(trim(coalesce(p_note, '')), '')
  where slug = p_slug;
  if not found then
    raise exception 'Studio not found' using errcode = 'P0002';
  end if;
  insert into public.admin_audit_log (actor_profile_id, action, detail)
  values (actor, 'schedule_visit', json_build_object('slug', p_slug, 'at', p_at, 'note', p_note));
  return json_build_object('ok', true);
end;
$$;
revoke all on function public.admin_schedule_visit(text, timestamptz, text) from public;
grant execute on function public.admin_schedule_visit(text, timestamptz, text) to authenticated;

create or replace function public.booking_studio_contact(p_booking_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  pid uuid := private.current_profile_id();
begin
  return (
    select jsonb_build_object(
      'email', pr.contact_email,
      'provider', pr.name,
      'member', m.full_name,
      'when', to_char(timezone('Africa/Nairobi', b.scheduled_at), 'Dy DD Mon HH24:MI'),
      'service', coalesce((
        select string_agg(s.name, ', ')
        from public.booking_items bi
        join public.services s on s.id = bi.service_id
        where bi.booking_id = b.id
      ), 'Visit'),
      'coins', b.coins,
      'payout', b.payout_ksh
    )
    from public.bookings b
    join public.providers pr on pr.id = b.provider_id
    join public.profiles m on m.id = b.member_profile_id
    where b.id = p_booking_id
      and (b.member_profile_id = pid or (select private.is_admin()))
  );
end;
$$;
revoke all on function public.booking_studio_contact(uuid) from public;
grant execute on function public.booking_studio_contact(uuid) to authenticated;

create or replace function public.dispute_notice(p_code text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object(
      'code', d.code,
      'status', d.status,
      'reason', d.reason,
      'note', d.resolution_note,
      'refundCoins', d.refund_coins,
      'memberName', m.full_name,
      'memberEmail', m.email,
      'providerName', p.name,
      'providerEmail', p.contact_email
    )
    from public.disputes d
    join public.bookings b on b.id = d.booking_id
    join public.profiles m on m.id = b.member_profile_id
    join public.providers p on p.id = b.provider_id
    where d.code = p_code
  );
end;
$$;
revoke all on function public.dispute_notice(text) from public;
grant execute on function public.dispute_notice(text) to authenticated;

create or replace function public.admin_search(p_query text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  q text := trim(coalesce(p_query, ''));
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  if char_length(q) < 2 then
    return jsonb_build_object('providers', '[]'::jsonb, 'members', '[]'::jsonb, 'bookings', '[]'::jsonb, 'disputes', '[]'::jsonb, 'companies', '[]'::jsonb, 'gifts', '[]'::jsonb);
  end if;
  return jsonb_build_object(
    'providers', coalesce((
      select jsonb_agg(jsonb_build_object('slug', p.slug, 'label', p.name, 'hint', p.area || ' · ' || p.status))
      from (
        select * from public.providers
        where name ilike '%' || q || '%' or slug ilike '%' || q || '%' or area ilike '%' || q || '%' or application_ref ilike '%' || q || '%'
        order by name limit 6
      ) p
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'label', m.full_name, 'hint', coalesce(m.email, m.area)))
      from (
        select * from public.profiles
        where role = 'member' and (full_name ilike '%' || q || '%' or email ilike '%' || q || '%' or phone ilike '%' || q || '%')
        order by full_name limit 6
      ) m
    ), '[]'::jsonb),
    'disputes', coalesce((
      select jsonb_agg(jsonb_build_object('code', d.code, 'label', d.code, 'hint', d.reason))
      from (
        select * from public.disputes
        where code ilike '%' || q || '%' or reason ilike '%' || q || '%'
        order by created_at desc limit 6
      ) d
    ), '[]'::jsonb),
    'companies', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'label', c.name, 'hint', c.billing_email))
      from (
        select * from public.companies
        where name ilike '%' || q || '%' or billing_email ilike '%' || q || '%'
        order by name limit 6
      ) c
    ), '[]'::jsonb),
    'gifts', coalesce((
      select jsonb_agg(jsonb_build_object('id', g.id, 'label', g.code, 'hint', g.to_name || ' · ' || g.status))
      from (
        select * from public.gifts
        where code ilike '%' || q || '%' or to_name ilike '%' || q || '%' or from_name ilike '%' || q || '%' or to_phone ilike '%' || q || '%'
        order by created_at desc limit 6
      ) g
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_search(text) from public;
grant execute on function public.admin_search(text) to authenticated;

create or replace function public.admin_audit(p_limit integer default 80)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(x.obj order by x.created_at desc)
    from (
      select a.created_at,
        jsonb_build_object(
          'action', a.action,
          'at', to_char(timezone('Africa/Nairobi', a.created_at), 'DD Mon HH24:MI'),
          'actor', coalesce(pr.full_name, 'System'),
          'detail', a.detail
        ) as obj
      from public.admin_audit_log a
      left join public.profiles pr on pr.id = a.actor_profile_id
      order by a.created_at desc
      limit least(coalesce(p_limit, 80), 200)
    ) x
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_audit(integer) from public;
grant execute on function public.admin_audit(integer) to authenticated;

create or replace function public.admin_health()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'applications', (select count(*)::int from public.providers where status = 'applied'),
    'staleApplications', (select count(*)::int from public.providers where status = 'applied' and applied_at < now() - interval '3 days'),
    'openDisputes', (select count(*)::int from public.disputes where status <> 'resolved'),
    'oldDisputes', (select count(*)::int from public.disputes where status <> 'resolved' and created_at < now() - interval '24 hours'),
    'missingPins', (select count(*)::int from public.providers where location_lat is null),
    'studiosWithoutEmail', (select count(*)::int from public.providers where status = 'applied' and contact_email is null),
    'bookingsToday', (select count(*)::int from public.bookings where (timezone('Africa/Nairobi', scheduled_at))::date = (timezone('Africa/Nairobi', now()))::date),
    'pausedMembers', (select count(*)::int from public.profiles where status = 'paused'),
    'giftsWaiting', (select count(*)::int from public.gifts where status in ('waiting', 'scheduled')),
    'documents', (select count(*)::int from public.provider_documents)
  );
end;
$$;
revoke all on function public.admin_health() from public;
grant execute on function public.admin_health() to authenticated;

create or replace function public.admin_gifts()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'Admin only' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', g.id, 'code', g.code, 'fromName', g.from_name, 'toName', g.to_name,
      'toPhone', g.to_phone, 'tier', g.tier, 'coins', g.coins, 'priceKsh', g.price_ksh,
      'status', g.status, 'claimBy', to_char(g.claim_by, 'DD Mon'),
      'createdAt', to_char(timezone('Africa/Nairobi', g.created_at), 'DD Mon HH24:MI')
    ) order by g.created_at desc)
    from public.gifts g
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_gifts() from public;
grant execute on function public.admin_gifts() to authenticated;

create or replace function public.admin_companies()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'Admin only' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'email', c.billing_email,
      'phone', c.phone,
      'seats', (select count(*)::int from public.company_seats s where s.company_id = c.id and s.status = 'active'),
      'invited', (select count(*)::int from public.company_seats s where s.company_id = c.id and s.status = 'invited'),
      'dueOn', (select to_char(min(i.due_on), 'DD Mon') from public.company_invoices i where i.company_id = c.id and i.status in ('due', 'overdue')),
      'amountKsh', (select coalesce(sum(i.amount_ksh), 0)::int from public.company_invoices i where i.company_id = c.id and i.status in ('due', 'overdue'))
    ) order by c.name)
    from public.companies c
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_companies() from public;
grant execute on function public.admin_companies() to authenticated;

create or replace function public.admin_extend_company_invoice(p_company_id uuid, p_due date)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := private.require_admin();
begin
  update public.company_invoices
  set due_on = p_due, status = 'due'
  where company_id = p_company_id and status in ('due', 'overdue');
  insert into public.admin_audit_log (actor_profile_id, action, detail)
  values (actor, 'extend_company_invoice', json_build_object('company', p_company_id, 'due', p_due));
  return json_build_object('ok', true);
end;
$$;
revoke all on function public.admin_extend_company_invoice(uuid, date) from public;
grant execute on function public.admin_extend_company_invoice(uuid, date) to authenticated;

create or replace function public.admin_finance()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'Admin only' using errcode = '42501'; end if;
  return jsonb_build_object(
    'coinsOutstanding', (select coalesce(sum(available), 0)::int from public.wallets),
    'coinsOnHold', (select coalesce(sum(on_hold), 0)::int from public.wallets),
    'visitsMonth', (select count(*)::int from public.bookings where status <> 'cancelled' and created_at >= date_trunc('month', now())),
    'coinsSpentMonth', (select coalesce(sum(coins), 0)::int from public.bookings where status <> 'cancelled' and created_at >= date_trunc('month', now())),
    'cashKshMonth', (select coalesce(sum(cash_ksh), 0)::int from public.bookings where status <> 'cancelled' and created_at >= date_trunc('month', now())),
    'payoutKshMonth', (select coalesce(sum(payout_ksh), 0)::int from public.bookings where status <> 'cancelled' and created_at >= date_trunc('month', now())),
    'months', coalesce((
      select jsonb_agg(jsonb_build_object('month', v.month, 'cash', v.cash, 'payout', v.payout) order by v.m)
      from (
        select date_trunc('month', g.d) as m,
               to_char(g.d, 'Mon') as month,
               coalesce(sum(b.cash_ksh), 0)::int as cash,
               coalesce(sum(b.payout_ksh), 0)::int as payout
        from generate_series(date_trunc('month', now()) - interval '3 months', date_trunc('month', now()), interval '1 month') as g(d)
        left join public.bookings b
          on date_trunc('month', b.created_at) = date_trunc('month', g.d)
         and b.status <> 'cancelled'
        group by 1, 2
      ) v
    ), '[]'::jsonb),
    'mix', coalesce((
      select jsonb_agg(jsonb_build_object(
        'member', coalesce(m.tier::text, 'none'),
        'provider', p.class::text,
        'visits', count(*)::int,
        'marginKsh', coalesce(sum(b.cash_ksh - b.payout_ksh), 0)::int
      ))
      from public.bookings b
      join public.profiles m on m.id = b.member_profile_id
      join public.providers p on p.id = b.provider_id
      where b.status <> 'cancelled' and b.created_at >= date_trunc('month', now())
      group by 1, 2
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_finance() from public;
grant execute on function public.admin_finance() to authenticated;

create or replace function public.admin_payout_lines()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  week_start date := date_trunc('week', timezone('Africa/Nairobi', now()))::date;
begin
  if not private.is_admin() then raise exception 'Admin only' using errcode = '42501'; end if;
  return jsonb_build_object(
    'weekStart', to_char(week_start, 'DD Mon'),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', p.slug,
        'name', p.name,
        'visits', count(b.id)::int,
        'earned', coalesce(sum(b.payout_ksh), 0)::int,
        'method', coalesce(p.payout_method, '—'),
        'status', case when p.status = 'live' then 'calculated' else p.status::text end
      ) order by coalesce(sum(b.payout_ksh), 0) desc)
      from public.providers p
      left join public.bookings b
        on b.provider_id = p.id
       and b.status in ('done', 'no_show')
       and (timezone('Africa/Nairobi', b.scheduled_at))::date >= week_start
       and (timezone('Africa/Nairobi', b.scheduled_at))::date < week_start + 7
      where p.status = 'live'
      group by p.id
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_payout_lines() from public;
grant execute on function public.admin_payout_lines() to authenticated;

create or replace function public.provider_documents(p_slug text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  pid uuid := private.provider_id_for(p_slug);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', d.id, 'label', d.label, 'path', d.storage_path, 'at', d.created_at) order by d.created_at desc)
    from public.provider_documents d where d.provider_id = pid
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.provider_documents(text) from public;
grant execute on function public.provider_documents(text) to authenticated;

-- A fresh application can store files before the owner account is linked.
drop policy if exists "Recent applications upload docs" on storage.objects;
create policy "Recent applications upload docs" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'provider-docs'
    and exists (
      select 1 from public.providers p
      where p.id::text = (storage.foldername(name))[1]
        and p.status = 'applied'
        and p.applied_at > now() - interval '2 hours'
    )
  );

create or replace function public.register_application_document(
  p_slug text,
  p_ref text,
  p_label text,
  p_path text
) returns json
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid;
begin
  select p.id into pid
  from public.providers p
  where p.slug = p_slug
    and p.application_ref = upper(trim(p_ref))
    and p.status = 'applied'
    and p.applied_at > now() - interval '2 hours';
  if pid is null then
    raise exception 'This application cannot accept a document now' using errcode = '42501';
  end if;
  if position(pid::text || '/' in p_path) <> 1 then
    raise exception 'Document path must stay in this studio folder';
  end if;
  insert into public.provider_documents (provider_id, label, storage_path)
  values (pid, left(trim(p_label), 80), p_path);
  return json_build_object('ok', true);
end;
$$;
revoke all on function public.register_application_document(text, text, text, text) from public;
grant execute on function public.register_application_document(text, text, text, text) to anon, authenticated;

create or replace function public.provider_application_status(p_ref text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_ref text := upper(trim(coalesce(p_ref, '')));
begin
  if v_ref !~ '^BW-PRV-[0-9]+$' then
    return null;
  end if;
  return (
    select jsonb_build_object(
      'ref', p.application_ref,
      'name', p.name,
      'area', p.area,
      'kind', p.kind,
      'status', p.status,
      'appliedAt', p.applied_at,
      'reviewNote', p.review_note,
      'address', p.address_text,
      'slug', p.slug,
      'visitAt', p.visit_at,
      'visitNote', p.visit_note
    )
    from public.providers p
    where p.application_ref = v_ref
  );
end;
$$;
revoke all on function public.provider_application_status(text) from public;
grant execute on function public.provider_application_status(text) to anon, authenticated;

create or replace function public.admin_studio_visit(p_slug text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object('visitAt', p.visit_at, 'visitNote', p.visit_note)
    from public.providers p
    where p.slug = p_slug
  );
end;
$$;
revoke all on function public.admin_studio_visit(text) from public;
grant execute on function public.admin_studio_visit(text) to authenticated;

create or replace function public.admin_note(p_action text, p_detail jsonb)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := private.require_admin();
begin
  if char_length(trim(coalesce(p_action, ''))) < 2 then
    raise exception 'Action required';
  end if;
  insert into public.admin_audit_log (actor_profile_id, action, detail)
  values (actor, left(trim(p_action), 80), coalesce(p_detail, '{}'::jsonb));
  return json_build_object('ok', true);
end;
$$;
revoke all on function public.admin_note(text, jsonb) from public;
grant execute on function public.admin_note(text, jsonb) to authenticated;

create or replace function public.admin_roster()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('name', p.full_name, 'email', p.email) order by p.full_name)
    from public.profiles p
    where p.role = 'admin'
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_roster() from public;
grant execute on function public.admin_roster() to authenticated;
