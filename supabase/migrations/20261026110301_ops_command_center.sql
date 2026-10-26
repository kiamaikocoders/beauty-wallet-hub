-- Operations command center: contact fields on applications, live map pins,
-- application status the vendor can read, and an admin board that is not sample data.

alter table public.providers
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists review_note text;

update public.providers
set contact_email = nullif(substring(about from 'Email: ([^[:space:]]+)'), '')
where contact_email is null
  and about is not null
  and about like '%Email:%';

update public.providers
set contact_phone = nullif(btrim(substring(about from E'Phone: ([^\n]+)')), '')
where contact_phone is null
  and about is not null
  and about like '%Phone:%';

update public.providers p
set owner_profile_id = sub.id
from (
  select distinct on (lower(pr.email)) pr.id, lower(pr.email) as email
  from public.profiles pr
  where pr.email is not null
    and pr.user_id is not null
  order by lower(pr.email), pr.created_at desc
) sub
where p.owner_profile_id is null
  and p.contact_email is not null
  and lower(p.contact_email) = sub.email;

create index if not exists providers_contact_email_idx
  on public.providers (lower(contact_email))
  where contact_email is not null;

-- Re-declare apply so the email, phone and signed-in owner are stored on the row.
create or replace function public.apply_as_provider(
  p_name text,
  p_kind text,
  p_area text,
  p_phone text,
  p_email text,
  p_social text default null,
  p_home_visits boolean default false,
  p_team_size text default null,
  p_class text default 'basic',
  p_services text default null,
  p_payout_method text default null,
  p_payout_details text default null,
  p_kyc_docs text[] default '{}'::text[],
  p_location_lat double precision default null,
  p_location_lng double precision default null,
  p_address_text text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := trim(p_name);
  v_kind text := trim(p_kind);
  v_area text := trim(p_area);
  v_phone text := trim(p_phone);
  v_email text := lower(trim(p_email));
  v_social text := nullif(trim(coalesce(p_social, '')), '');
  v_team text := nullif(trim(coalesce(p_team_size, '')), '');
  v_class public.tier_id;
  v_services text := nullif(trim(coalesce(p_services, '')), '');
  v_payout_method text := nullif(trim(coalesce(p_payout_method, '')), '');
  v_payout_details text := nullif(trim(coalesce(p_payout_details, '')), '');
  v_docs text[] := coalesce(p_kyc_docs, '{}'::text[]);
  v_address text := nullif(trim(coalesce(p_address_text, '')), '');
  v_slug text;
  v_base text;
  v_pct numeric(4, 3);
  v_ref text;
  v_id uuid;
  v_about text;
  v_owner text;
  v_profile uuid;
  v_n integer := 0;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'invalid name';
  end if;
  if char_length(v_kind) < 2 or char_length(v_kind) > 60 then
    raise exception 'invalid kind';
  end if;
  if char_length(v_area) < 2 or char_length(v_area) > 80 then
    raise exception 'invalid area';
  end if;
  if char_length(v_phone) < 7 or char_length(v_phone) > 32 then
    raise exception 'invalid phone';
  end if;
  if char_length(v_email) < 5 or char_length(v_email) > 120 or position('@' in v_email) = 0 then
    raise exception 'invalid email';
  end if;
  if p_location_lat is not null and (p_location_lat < -5 or p_location_lat > 5 or p_location_lng < 33 or p_location_lng > 42) then
    raise exception 'pin must be in Kenya';
  end if;

  begin
    v_class := lower(trim(p_class))::public.tier_id;
  exception when others then
    raise exception 'invalid class';
  end;

  select b.default_pct into v_pct
  from public.payout_bands b
  where b.class = v_class;

  if v_pct is null then
    raise exception 'missing payout band';
  end if;

  v_base := lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_base := trim(both '-' from v_base);
  if v_base = '' then
    v_base := 'provider';
  end if;
  v_slug := v_base;
  while exists (select 1 from public.providers p where p.slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n::text;
  end loop;

  v_ref := 'BW-PRV-' || nextval('public.provider_application_ref_seq')::text;
  v_owner := split_part(v_email, '@', 1);
  v_about := concat_ws(
    E'\n',
    'Phone: ' || v_phone,
    'Email: ' || v_email,
    case when v_social is not null then 'Social: ' || v_social end,
    case when v_team is not null then 'Team size: ' || v_team end,
    case when v_services is not null then 'Services: ' || v_services end
  );

  v_profile := private.current_profile_id();
  if v_profile is null then
    select pr.id into v_profile
    from public.profiles pr
    where pr.user_id is not null
      and lower(pr.email) = v_email
    order by pr.created_at desc
    limit 1;
  end if;

  insert into public.providers (
    slug, name, area, kind, about, class, payout_pct, status, verified,
    home_visits, owner_name, owner_profile_id, kyc_docs, payout_method, application_ref, applied_at,
    location_lat, location_lng, address_text, contact_email, contact_phone
  ) values (
    v_slug,
    v_name,
    v_area,
    v_kind,
    v_about,
    v_class,
    v_pct,
    'applied',
    false,
    coalesce(p_home_visits, false),
    v_owner,
    v_profile,
    v_docs,
    case
      when v_payout_method is null then null
      when v_payout_details is null then v_payout_method
      else v_payout_method || ': ' || v_payout_details
    end,
    v_ref,
    now(),
    p_location_lat,
    p_location_lng,
    v_address,
    v_email,
    v_phone
  )
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'ref', v_ref,
    'slug', v_slug,
    'payout_pct', v_pct
  );
end;
$$;

create or replace function public.provider_application_status(p_ref text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
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
      'slug', p.slug
    )
    from public.providers p
    where p.application_ref = v_ref
  );
end;
$$;

revoke all on function public.provider_application_status(text) from public;
grant execute on function public.provider_application_status(text) to anon, authenticated;

create or replace function public.my_provider()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid := private.current_profile_id();
  v_email text;
  row public.providers%rowtype;
begin
  if pid is null then
    return null;
  end if;

  select lower(email) into v_email from public.profiles where id = pid;

  select p.* into row
  from public.providers p
  where p.owner_profile_id = pid
     or (
       p.owner_profile_id is null
       and v_email is not null
       and lower(p.contact_email) = v_email
     )
  order by (p.owner_profile_id is not distinct from pid) desc, p.applied_at desc
  limit 1;

  if not found then
    return null;
  end if;

  if row.owner_profile_id is null then
    update public.providers
    set owner_profile_id = pid
    where id = row.id
      and owner_profile_id is null;
    row.owner_profile_id := pid;
  end if;

  if row.status = 'live' then
    update public.profiles
    set role = 'provider'
    where id = pid
      and role = 'member';
  end if;

  return jsonb_build_object(
    'slug', row.slug,
    'name', row.name,
    'area', row.area,
    'kind', row.kind,
    'status', row.status,
    'ref', row.application_ref,
    'reviewNote', row.review_note
  );
end;
$$;

revoke all on function public.my_provider() from public;
grant execute on function public.my_provider() to authenticated;

drop function if exists public.admin_review_provider(text, text, public.tier_id, numeric);

create function public.admin_review_provider(
  p_slug text,
  p_decision text,
  p_class public.tier_id default null,
  p_payout_pct numeric default null,
  p_note text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.require_admin();
  row public.providers%rowtype;
  new_status public.provider_status;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
  v_owner uuid;
begin
  if p_decision not in ('approve', 'reject', 'ask_changes') then
    raise exception 'Invalid decision' using errcode = '22023';
  end if;

  select * into row from public.providers where slug = p_slug for update;
  if not found then
    raise exception 'Provider not found' using errcode = 'P0002';
  end if;

  new_status := case p_decision
    when 'approve' then 'live'::public.provider_status
    when 'reject' then 'rejected'::public.provider_status
    else 'applied'::public.provider_status
  end;

  v_owner := row.owner_profile_id;
  if v_owner is null and row.contact_email is not null then
    select pr.id into v_owner
    from public.profiles pr
    where pr.user_id is not null
      and lower(pr.email) = lower(row.contact_email)
    order by pr.created_at desc
    limit 1;
  end if;

  update public.providers
  set status = new_status,
      verified = (p_decision = 'approve'),
      class = coalesce(p_class, class),
      payout_pct = coalesce(p_payout_pct, payout_pct),
      review_note = case when p_decision = 'approve' then v_note else coalesce(v_note, review_note) end,
      owner_profile_id = coalesce(owner_profile_id, v_owner)
  where id = row.id;

  if p_decision = 'approve' and v_owner is not null then
    update public.profiles
    set role = 'provider'
    where id = v_owner
      and role = 'member';
  end if;

  insert into public.admin_audit_log (actor_profile_id, action, detail)
  values (actor, 'review_provider', json_build_object(
    'slug', p_slug,
    'decision', p_decision,
    'class', coalesce(p_class, row.class),
    'payout_pct', coalesce(p_payout_pct, row.payout_pct),
    'note', v_note
  ));

  return json_build_object(
    'ok', true,
    'status', new_status,
    'email', row.contact_email,
    'phone', row.contact_phone,
    'name', row.name,
    'slug', row.slug,
    'ref', row.application_ref,
    'class', coalesce(p_class, row.class),
    'payoutPct', coalesce(p_payout_pct, row.payout_pct)
  );
end;
$$;

revoke all on function public.admin_review_provider(text, text, public.tier_id, numeric, text) from public;
grant execute on function public.admin_review_provider(text, text, public.tier_id, numeric, text) to authenticated;

create or replace function public.admin_provider_file(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object(
      'slug', p.slug,
      'name', p.name,
      'area', p.area,
      'kind', p.kind,
      'about', p.about,
      'class', p.class,
      'payoutPct', p.payout_pct,
      'status', p.status,
      'verified', p.verified,
      'homeVisits', p.home_visits,
      'ownerName', p.owner_name,
      'kycDocs', p.kyc_docs,
      'payoutMethod', p.payout_method,
      'ref', p.application_ref,
      'appliedAt', p.applied_at,
      'reviewNote', p.review_note,
      'email', p.contact_email,
      'phone', p.contact_phone,
      'address', p.address_text,
      'lat', p.location_lat,
      'lng', p.location_lng,
      'rating', p.rating,
      'services', coalesce((
        select jsonb_agg(jsonb_build_object(
          'name', s.name,
          'minutes', s.minutes,
          'cashKsh', s.cash_ksh,
          'active', s.active
        ) order by s.sort, s.name)
        from public.services s
        where s.provider_id = p.id
      ), '[]'::jsonb)
    )
    from public.providers p
    where p.slug = p_slug
  );
end;
$$;

revoke all on function public.admin_provider_file(text) from public;
grant execute on function public.admin_provider_file(text) to authenticated;

create or replace function public.admin_map_points()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not admin' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'providers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'slug', p.slug,
        'name', p.name,
        'area', p.area,
        'kind', coalesce(p.kind, 'Studio'),
        'status', p.status,
        'lat', p.location_lat,
        'lng', p.location_lng,
        'address', p.address_text,
        'class', p.class,
        'rating', p.rating,
        'phone', p.contact_phone,
        'ref', p.application_ref
      ) order by p.name)
      from public.providers p
      where p.location_lat is not null and p.location_lng is not null
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pr.id,
        'name', pr.full_name,
        'area', coalesce(pr.area, 'Nairobi'),
        'plan', coalesce(pr.tier::text, 'basic'),
        'status', pr.status,
        'lat', pr.location_lat,
        'lng', pr.location_lng
      ) order by pr.full_name)
      from public.profiles pr
      where pr.role = 'member'
        and pr.location_lat is not null
        and pr.location_lng is not null
    ), '[]'::jsonb),
    'neighbourhoods', coalesce((
      select jsonb_agg(jsonb_build_object('area', n.area, 'members', n.members) order by n.members desc)
      from (
        select coalesce(pr.area, 'Nairobi') as area, count(*)::int as members
        from public.profiles pr
        where pr.role = 'member' and pr.location_lat is not null
        group by 1
      ) n
    ), '[]'::jsonb),
    'unpinned', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'slug', p.slug,
        'name', p.name,
        'area', p.area,
        'kind', coalesce(p.kind, 'Studio'),
        'status', p.status,
        'address', p.address_text,
        'class', p.class,
        'phone', p.contact_phone,
        'ref', p.application_ref
      ) order by p.name)
      from public.providers p
      where p.location_lat is null or p.location_lng is null
    ), '[]'::jsonb),
    'missingPins', (
      select count(*)::int from public.providers p where p.location_lat is null
    ),
    'missingMemberPins', (
      select count(*)::int
      from public.profiles pr
      where pr.role = 'member' and pr.location_lat is null
    )
  );
end;
$$;

create or replace function public.admin_ops_board()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'applications', (select count(*)::int from public.providers where status = 'applied'),
    'liveProviders', (select count(*)::int from public.providers where status = 'live'),
    'members', (select count(*)::int from public.profiles where role = 'member'),
    'bookingsToday', (
      select count(*)::int from public.bookings b
      where (timezone('Africa/Nairobi', b.scheduled_at))::date = (timezone('Africa/Nairobi', now()))::date
    ),
    'openDisputes', (
      select count(*)::int from public.disputes where status <> 'resolved'
    ),
    'missingPins', (
      select count(*)::int from public.providers where location_lat is null
    ),
    'coinsOutstanding', (select coalesce(sum(available), 0)::int from public.wallets),
    'coinsOnHold', (select coalesce(sum(on_hold), 0)::int from public.wallets),
    'visits', coalesce((
      select jsonb_agg(jsonb_build_object('day', v.day, 'count', v.visits) order by v.d)
      from (
        select g.d::date as d,
               to_char(g.d, 'Dy') as day,
               (
                 select count(*)::int
                 from public.bookings b
                 where (timezone('Africa/Nairobi', b.scheduled_at))::date = g.d::date
                   and b.status <> 'cancelled'
               ) as visits
        from generate_series(
          (timezone('Africa/Nairobi', now()))::date - 6,
          (timezone('Africa/Nairobi', now()))::date,
          interval '1 day'
        ) as g(d)
      ) v
    ), '[]'::jsonb),
    'queue', coalesce((
      select jsonb_agg(x.obj order by x.applied_at desc)
      from (
        select p.applied_at,
               jsonb_build_object(
                 'slug', p.slug,
                 'name', p.name,
                 'area', p.area,
                 'kind', p.kind,
                 'status', p.status,
                 'appliedAt', to_char(timezone('Africa/Nairobi', p.applied_at), 'DD Mon HH24:MI'),
                 'ref', p.application_ref
               ) as obj
        from public.providers p
        where p.status = 'applied'
        order by p.applied_at desc
        limit 20
      ) x
    ), '[]'::jsonb),
    'bookings', coalesce((
      select jsonb_agg(x.obj order by x.scheduled_at desc)
      from (
        select b.scheduled_at,
               jsonb_build_object(
                 'id', b.id,
                 'when', to_char(timezone('Africa/Nairobi', b.scheduled_at), 'Dy DD Mon HH24:MI'),
                 'status', b.status,
                 'coins', b.coins,
                 'member', m.full_name,
                 'plan', coalesce(m.tier::text, 'basic'),
                 'provider', p.name,
                 'service', coalesce((
                   select string_agg(s.name, ', ' order by s.name)
                   from public.booking_items bi
                   join public.services s on s.id = bi.service_id
                   where bi.booking_id = b.id
                 ), 'Visit'),
                 'bucket', case
                   when b.status = 'cancelled' then 'cancelled'
                   when b.status = 'no_show' then 'no_show'
                   when (timezone('Africa/Nairobi', b.scheduled_at))::date = (timezone('Africa/Nairobi', now()))::date then 'today'
                   when b.scheduled_at > now() then 'upcoming'
                   else 'past'
                 end
               ) as obj
        from public.bookings b
        join public.profiles m on m.id = b.member_profile_id
        join public.providers p on p.id = b.provider_id
        order by b.scheduled_at desc
        limit 80
      ) x
    ), '[]'::jsonb),
    'disputes', coalesce((
      select jsonb_agg(x.obj order by x.created_at desc)
      from (
        select d.created_at,
               jsonb_build_object(
                 'code', d.code,
                 'status', d.status,
                 'reason', d.reason,
                 'memberMessage', d.member_message,
                 'providerMessage', d.provider_message,
                 'when', to_char(timezone('Africa/Nairobi', d.created_at), 'DD Mon HH24:MI'),
                 'member', m.full_name,
                 'provider', p.name,
                 'coins', b.coins,
                 'service', coalesce((
                   select string_agg(s.name, ', ' order by s.name)
                   from public.booking_items bi
                   join public.services s on s.id = bi.service_id
                   where bi.booking_id = b.id
                 ), d.reason)
               ) as obj
        from public.disputes d
        join public.bookings b on b.id = d.booking_id
        join public.profiles m on m.id = b.member_profile_id
        join public.providers p on p.id = b.provider_id
        order by d.created_at desc
        limit 40
      ) x
    ), '[]'::jsonb),
    'audit', coalesce((
      select jsonb_agg(x.obj order by x.created_at desc)
      from (
        select a.created_at,
               jsonb_build_object(
                 'action', a.action,
                 'at', to_char(timezone('Africa/Nairobi', a.created_at), 'DD Mon HH24:MI'),
                 'detail', left(a.detail::text, 180)
               ) as obj
        from public.admin_audit_log a
        order by a.created_at desc
        limit 8
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_ops_board() from public;
grant execute on function public.admin_ops_board() to authenticated;

create or replace function public.admin_member_file(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object(
      'id', pr.id,
      'name', pr.full_name,
      'email', pr.email,
      'phone', pr.phone,
      'area', coalesce(pr.area, '—'),
      'plan', coalesce(pr.tier::text, 'basic'),
      'status', pr.status,
      'renews', coalesce(to_char(pr.renews_on, 'DD Mon YYYY'), '—'),
      'available', coalesce(w.available, 0),
      'onHold', coalesce(w.on_hold, 0),
      'visits', (select count(*)::int from public.bookings b where b.member_profile_id = pr.id),
      'ledger', coalesce((
        select jsonb_agg(jsonb_build_object(
          'at', to_char(timezone('Africa/Nairobi', c.created_at), 'DD Mon HH24:MI'),
          'kind', c.kind,
          'coins', c.coins,
          'note', c.note
        ) order by c.created_at desc)
        from (
          select * from public.coin_transactions
          where profile_id = pr.id
          order by created_at desc
          limit 20
        ) c
      ), '[]'::jsonb),
      'bookings', coalesce((
        select jsonb_agg(jsonb_build_object(
          'when', to_char(timezone('Africa/Nairobi', b.scheduled_at), 'DD Mon HH24:MI'),
          'status', b.status,
          'coins', b.coins,
          'provider', p.name
        ) order by b.scheduled_at desc)
        from (
          select * from public.bookings
          where member_profile_id = pr.id
          order by scheduled_at desc
          limit 8
        ) b
        join public.providers p on p.id = b.provider_id
      ), '[]'::jsonb)
    )
    from public.profiles pr
    left join public.wallets w on w.profile_id = pr.id
    where pr.id = p_id
  );
end;
$$;

revoke all on function public.admin_member_file(uuid) from public;
grant execute on function public.admin_member_file(uuid) to authenticated;

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
  d public.disputes%rowtype;
  b public.bookings%rowtype;
  v_refund integer;
  v_avail integer;
begin
  if p_decision not in ('redo', 'half', 'full') then
    raise exception 'Invalid decision' using errcode = '22023';
  end if;

  select * into d from public.disputes where code = p_code for update;
  if not found then
    raise exception 'Dispute not found' using errcode = 'P0002';
  end if;
  if d.status = 'resolved' then
    raise exception 'Dispute already resolved' using errcode = '22023';
  end if;

  select * into b from public.bookings where id = d.booking_id;
  if not found then
    raise exception 'Booking missing' using errcode = 'P0002';
  end if;

  v_refund := case p_decision
    when 'full' then b.coins
    when 'half' then b.coins / 2
    else 0
  end;

  if v_refund > 0 then
    update public.wallets
    set available = available + v_refund,
        updated_at = now()
    where profile_id = b.member_profile_id
    returning available into v_avail;
    if v_avail is null then
      raise exception 'Member wallet missing' using errcode = 'P0001';
    end if;
    insert into public.coin_transactions (profile_id, booking_id, kind, coins, note)
    values (
      b.member_profile_id,
      b.id,
      'refund',
      v_refund,
      coalesce(nullif(trim(p_note), ''), 'Dispute ' || p_code)
    );
  end if;

  update public.disputes
  set status = 'resolved',
      outcome = case p_decision
        when 'redo' then 'redo'
        when 'half' then 'half_refund'
        else 'full_refund'
      end,
      refund_coins = v_refund,
      resolution_note = coalesce(nullif(trim(p_note), ''), resolution_note),
      resolved_at = now()
  where id = d.id;

  insert into public.admin_audit_log (actor_profile_id, action, detail)
  values (actor, 'resolve_dispute', json_build_object(
    'code', p_code, 'decision', p_decision, 'note', p_note, 'refund_coins', v_refund
  ));

  return json_build_object('ok', true, 'refundCoins', v_refund);
end;
$$;

create or replace function private.fill_provider_contact()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.contact_email is null and new.about is not null then
    new.contact_email := nullif(lower(substring(new.about from 'Email: ([^[:space:]]+)')), '');
  end if;
  if new.contact_phone is null and new.about is not null then
    new.contact_phone := nullif(btrim(substring(new.about from E'Phone: ([^\n]+)')), '');
  end if;
  if new.owner_profile_id is null then
    new.owner_profile_id := private.current_profile_id();
  end if;
  if new.owner_profile_id is null and new.contact_email is not null then
    select pr.id into new.owner_profile_id
    from public.profiles pr
    where pr.user_id is not null
      and lower(pr.email) = new.contact_email
    order by pr.created_at desc
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists fill_provider_contact on public.providers;
create trigger fill_provider_contact
  before insert or update of about, contact_email, contact_phone
  on public.providers
  for each row
  execute function private.fill_provider_contact();
