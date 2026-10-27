-- In-app notices. Members can read and mark their own rows. Inserts go through
-- record_notice, which checks the signed-in person is part of the event.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text not null default '/app/notifications',
  dedupe_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Read own notices"
  on public.notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Mark own notices"
  on public.notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create table private.internal_config (
  key text primary key,
  value text not null
);

revoke all on table private.internal_config from public, anon, authenticated;

create function private.insert_notice(
  p_user_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_href text,
  p_dedupe text,
  p_template text,
  p_email_data jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid;
  recipient_email text;
begin
  if p_user_id is null or p_dedupe is null or length(trim(p_title)) = 0 then
    return null;
  end if;
  insert into public.notifications (user_id, kind, title, body, href, dedupe_key)
  values (
    p_user_id,
    left(p_kind, 48),
    left(p_title, 140),
    left(p_body, 400),
    left(coalesce(nullif(p_href, ''), '/app/notifications'), 200),
    left(p_dedupe, 160)
  )
  on conflict (user_id, dedupe_key) do nothing
  returning id into nid;
  if nid is null then
    return null;
  end if;
  select p.email into recipient_email from public.profiles p where p.user_id = p_user_id limit 1;
  return jsonb_build_object(
    'id', nid,
    'userId', p_user_id,
    'email', recipient_email,
    'title', left(p_title, 140),
    'body', left(p_body, 400),
    'href', left(coalesce(nullif(p_href, ''), '/app/notifications'), 200),
    'template', p_template,
    'emailData', coalesce(p_email_data, '{}'::jsonb)
  );
end;
$$;

revoke all on function private.insert_notice(uuid, text, text, text, text, text, text, jsonb) from public, anon, authenticated;

create function private.push_note(notes jsonb, note jsonb) returns jsonb
language sql
immutable
as $$
  select case when note is null then notes else notes || jsonb_build_array(note) end
$$;

revoke all on function private.push_note(jsonb, jsonb) from public, anon, authenticated;

create or replace function public.record_notice(p_event text, p_ref text default '')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  notes jsonb := '[]'::jsonb;
  pid uuid;
  owner_uid uuid;
  member_uid uuid;
  member_name text;
  service_name text;
  provider_name text;
  when_label text;
  pin text;
  coins int;
  avail int;
  href text;
  bid uuid;
  tx_id bigint;
  b public.bookings;
  prof public.profiles;
  local_today date := (now() at time zone 'Africa/Nairobi')::date;
  rec record;
begin
  if uid is null then
    raise exception 'Sign in required' using errcode = 'P0001';
  end if;

  if p_event = 'sweep' then
    select * into prof from public.profiles where user_id = uid limit 1;
    if not found then
      return notes;
    end if;
    select available into avail from public.wallets where profile_id = prof.id;

    for rec in
      select distinct on (b.id)
        b.id,
        b.scheduled_at,
        s.name as service_name,
        pr.name as provider_name,
        bp.pin
      from public.bookings b
      join public.booking_items bi on bi.booking_id = b.id
      join public.services s on s.id = bi.service_id
      join public.providers pr on pr.id = b.provider_id
      left join public.booking_pins bp on bp.booking_id = b.id
      where b.member_profile_id = prof.id
        and b.status in ('booked', 'arriving')
        and (b.scheduled_at at time zone 'Africa/Nairobi')::date = local_today + 1
      order by b.id, s.name
    loop
      when_label := to_char(rec.scheduled_at at time zone 'Africa/Nairobi', 'Dy DD Mon HH24:MI');
      notes := private.push_note(notes, private.insert_notice(
        uid, 'booking_reminder',
        'Tomorrow: ' || rec.service_name,
        rec.service_name || ' at ' || rec.provider_name || ', ' || when_label || '.',
        '/app/bookings/' || rec.id,
        'reminder-eve:' || rec.id,
        'booking-reminder',
        jsonb_build_object(
          'firstName', split_part(prof.full_name, ' ', 1),
          'service', rec.service_name,
          'provider', rec.provider_name,
          'when', when_label
        )
      ));
    end loop;

    for rec in
      select distinct on (b.id)
        b.id, b.scheduled_at, s.name as service_name, pr.name as provider_name, bp.pin
      from public.bookings b
      join public.booking_items bi on bi.booking_id = b.id
      join public.services s on s.id = bi.service_id
      join public.providers pr on pr.id = b.provider_id
      left join public.booking_pins bp on bp.booking_id = b.id
      where b.member_profile_id = prof.id
        and b.status in ('booked', 'arriving')
        and (b.scheduled_at at time zone 'Africa/Nairobi')::date = local_today
      order by b.id, s.name
    loop
      when_label := to_char(rec.scheduled_at at time zone 'Africa/Nairobi', 'HH24:MI');
      notes := private.push_note(notes, private.insert_notice(
        uid, 'booking_reminder_today',
        'Today: ' || rec.service_name,
        rec.provider_name || ' at ' || when_label || '. Arrival PIN ' || coalesce(rec.pin, '····') || '.',
        '/app/bookings/' || rec.id,
        'reminder-day:' || rec.id,
        null,
        '{}'::jsonb
      ));
    end loop;

    for rec in
      select distinct on (b.id) b.id, s.name as service_name, pr.name as provider_name
      from public.bookings b
      join public.booking_items bi on bi.booking_id = b.id
      join public.services s on s.id = bi.service_id
      join public.providers pr on pr.id = b.provider_id
      where b.member_profile_id = prof.id
        and b.status = 'done'
        and b.scheduled_at > now() - interval '14 days'
        and not exists (select 1 from public.reviews r where r.booking_id = b.id)
      order by b.id, s.name
    loop
      notes := private.push_note(notes, private.insert_notice(
        uid, 'rate_visit',
        'How was ' || rec.service_name || '?',
        'Tell us about your visit at ' || rec.provider_name || '.',
        '/app/bookings/' || rec.id || '/rate',
        'rate:' || rec.id,
        'rate-visit',
        jsonb_build_object(
          'firstName', split_part(prof.full_name, ' ', 1),
          'service', rec.service_name,
          'provider', rec.provider_name
        )
      ));
    end loop;

    if coalesce(avail, 0) > 0 and avail <= 100 then
      notes := private.push_note(notes, private.insert_notice(
        uid, 'low_balance',
        'You have ' || avail || ' coins left',
        'Top up before your next visit, or plan one while this balance lasts.',
        '/app/wallet/top-up',
        'low-balance:' || to_char(local_today, 'YYYY-MM'),
        'low-balance',
        jsonb_build_object('firstName', split_part(prof.full_name, ' ', 1), 'coins', avail::text)
      ));
    end if;

    if prof.renews_on is not null and prof.status = 'active'
       and prof.renews_on between local_today and local_today + 3 then
      notes := private.push_note(notes, private.insert_notice(
        uid, 'renewal',
        'Your plan renews on ' || to_char(prof.renews_on, 'DD Mon'),
        coalesce(prof.tier::text, 'Your') || ' plan renews soon. Coins you do not use will follow the rollover rule.',
        '/app/plan',
        'renewal:' || prof.renews_on,
        'renewal',
        jsonb_build_object(
          'firstName', split_part(prof.full_name, ' ', 1),
          'tier', coalesce(prof.tier::text, 'plan'),
          'renewalDate', to_char(prof.renews_on, 'DD Mon YYYY')
        )
      ));
    end if;

    if prof.status = 'renewal_failed' then
      notes := private.push_note(notes, private.insert_notice(
        uid, 'renewal_failed',
        'We couldn’t renew your plan',
        'Your coins are safe. Pay to keep booking, or we will try again.',
        '/app/plan',
        'renewal-failed:' || coalesce(prof.renews_on::text, local_today::text),
        'payment-failed',
        jsonb_build_object(
          'firstName', split_part(prof.full_name, ' ', 1),
          'tier', coalesce(prof.tier::text, 'plan'),
          'reason', 'The renewal payment did not go through'
        )
      ));
      if prof.renews_on is not null and prof.renews_on < local_today then
        notes := private.push_note(notes, private.insert_notice(
          uid, 'renewal_unpaid',
          'Your plan is still unpaid',
          'New bookings stay paused until the renewal is paid.',
          '/app/plan',
          'renewal-unpaid:' || prof.renews_on,
          null,
          '{}'::jsonb
        ));
      end if;
    end if;

    if extract(day from (now() at time zone 'Africa/Nairobi')) = 1 then
      notes := private.push_note(notes, private.insert_notice(
        uid, 'statement',
        'Your monthly statement',
        'You have ' || coalesce(avail, 0) || ' coins available.',
        '/app/wallet',
        'statement:' || to_char(local_today, 'YYYY-MM'),
        'monthly-statement',
        jsonb_build_object(
          'firstName', split_part(prof.full_name, ' ', 1),
          'walletNow', coalesce(avail, 0)::text
        )
      ));
    end if;

    return notes;
  end if;

  if p_event in ('booking_confirmed', 'booking_cancelled', 'visit_done', 'no_show') then
    begin
      bid := p_ref::uuid;
    exception when others then
      raise exception 'Booking not found' using errcode = 'P0002';
    end;
    select * into b from public.bookings where id = bid;
    if not found then
      raise exception 'Booking not found' using errcode = 'P0002';
    end if;
    select user_id, full_name into member_uid, member_name
    from public.profiles where id = b.member_profile_id;
    select pr.name, owner.user_id into provider_name, owner_uid
    from public.providers pr
    left join public.profiles owner on owner.id = pr.owner_profile_id
    where pr.id = b.provider_id;
    select s.name into service_name
    from public.booking_items bi
    join public.services s on s.id = bi.service_id
    where bi.booking_id = b.id
    order by s.name
    limit 1;
    select bp.pin into pin from public.booking_pins bp where bp.booking_id = b.id;
    when_label := to_char(b.scheduled_at at time zone 'Africa/Nairobi', 'Dy DD Mon HH24:MI');
    href := '/app/bookings/' || b.id;
    service_name := coalesce(service_name, 'your visit');
    provider_name := coalesce(provider_name, 'your studio');

    if p_event in ('booking_confirmed', 'booking_cancelled') and member_uid is distinct from uid then
      raise exception 'Not allowed' using errcode = 'P0001';
    end if;
    if p_event in ('visit_done', 'no_show')
       and owner_uid is distinct from uid
       and not private.is_admin() then
      raise exception 'Not allowed' using errcode = 'P0001';
    end if;

    if p_event = 'booking_confirmed' then
      notes := private.push_note(notes, private.insert_notice(
        member_uid, 'booking_confirmed',
        'Booked: ' || service_name,
        provider_name || ', ' || when_label || '. ' || b.coins || ' coins held. Arrival PIN ' || coalesce(pin, '····') || '.',
        href, 'booking:' || b.id, null, '{}'::jsonb
      ));
      notes := private.push_note(notes, private.insert_notice(
        owner_uid, 'provider_new_booking',
        'New booking: ' || service_name,
        split_part(coalesce(member_name, 'A member'), ' ', 1) || ', ' || when_label || '. Payout Ksh ' || b.payout_ksh || '.',
        '/provider', 'provider-booking:' || b.id, null, '{}'::jsonb
      ));
      select available into avail from public.wallets where profile_id = b.member_profile_id;
      if coalesce(avail, 0) > 0 and avail <= 100 then
        notes := private.push_note(notes, private.insert_notice(
          member_uid, 'low_balance',
          'You have ' || avail || ' coins left',
          'Top up before your next visit.',
          '/app/wallet/top-up',
          'low-balance:' || to_char(local_today, 'YYYY-MM'),
          'low-balance',
          jsonb_build_object('coins', avail::text, 'firstName', split_part(coalesce(member_name, ''), ' ', 1))
        ));
      end if;
    elsif p_event = 'booking_cancelled' then
      notes := private.push_note(notes, private.insert_notice(
        member_uid, 'booking_cancelled',
        'Cancelled: ' || service_name,
        provider_name || ', ' || when_label || '. Coins from this visit are back in your wallet if the cancellation was free.',
        '/app/bookings', 'cancel:' || b.id, null, '{}'::jsonb
      ));
      notes := private.push_note(notes, private.insert_notice(
        owner_uid, 'provider_booking_cancelled',
        'Cancelled by member',
        split_part(coalesce(member_name, 'A member'), ' ', 1) || ', ' || service_name || ', ' || when_label || '. The slot is open again.',
        '/provider', 'provider-cancel:' || b.id, null, '{}'::jsonb
      ));
    elsif p_event = 'visit_done' then
      notes := private.push_note(notes, private.insert_notice(
        member_uid, 'rate_visit',
        'How was ' || service_name || '?',
        'Tell us about your visit at ' || provider_name || '.',
        href || '/rate', 'rate:' || b.id, 'rate-visit',
        jsonb_build_object('service', service_name, 'provider', provider_name, 'firstName', split_part(coalesce(member_name, ''), ' ', 1))
      ));
    else
      notes := private.push_note(notes, private.insert_notice(
        member_uid, 'no_show',
        'Missed visit: ' || service_name,
        provider_name || ' marked this visit as a no-show.',
        href, 'noshow:' || b.id, null, '{}'::jsonb
      ));
    end if;
    return notes;
  end if;

  if p_event = 'top_up' then
    select id into pid from public.profiles where user_id = uid limit 1;
    select ct.coins, ct.id, w.available into coins, tx_id, avail
    from public.coin_transactions ct
    join public.wallets w on w.profile_id = ct.profile_id
    where ct.profile_id = pid and ct.kind = 'top_up'
    order by ct.created_at desc
    limit 1;
    if coins is null then
      return notes;
    end if;
    notes := private.push_note(notes, private.insert_notice(
      uid, 'top_up',
      coins || ' coins added',
      'Your wallet now has ' || coalesce(avail, coins) || ' coins.',
      '/app/wallet', 'topup:' || tx_id, null, '{}'::jsonb
    ));
    return notes;
  end if;

  if p_event = 'plan_started' then
    select * into prof from public.profiles where user_id = uid limit 1;
    if not found then
      return notes;
    end if;
    select available into avail from public.wallets where profile_id = prof.id;
    notes := private.push_note(notes, private.insert_notice(
      uid, 'plan_started',
      'Your ' || coalesce(prof.tier::text, 'Beauty Wallet') || ' plan is active',
      'We added ' || coalesce(avail, 0) || ' coins. Next renewal ' || coalesce(to_char(prof.renews_on, 'DD Mon'), 'next month') || '.',
      '/app',
      'plan:' || coalesce(prof.tier::text, 'plan') || ':' || coalesce(prof.renews_on::text, 'start'),
      null, '{}'::jsonb
    ));
    return notes;
  end if;

  if p_event = 'dispute_resolved' then
    if not private.is_admin() then
      raise exception 'Not allowed' using errcode = 'P0001';
    end if;
    select d.refund_coins, m.user_id, pr.name, owner.user_id, d.code
      into coins, member_uid, provider_name, owner_uid, pin
    from public.disputes d
    join public.bookings b on b.id = d.booking_id
    join public.profiles m on m.id = b.member_profile_id
    join public.providers pr on pr.id = b.provider_id
    left join public.profiles owner on owner.id = pr.owner_profile_id
    where d.code = p_ref;
    if member_uid is null and owner_uid is null then
      return notes;
    end if;
    notes := private.push_note(notes, private.insert_notice(
      member_uid, 'dispute',
      'Dispute ' || coalesce(pin, p_ref) || ' is decided',
      case when coalesce(coins, 0) > 0 then coins || ' coins were returned.' else 'The studio has the decision.' end,
      '/app/wallet', 'dispute-member:' || p_ref, null, '{}'::jsonb
    ));
    notes := private.push_note(notes, private.insert_notice(
      owner_uid, 'dispute',
      'Dispute ' || coalesce(pin, p_ref) || ' is decided',
      'Open the studio portal for the outcome.',
      '/provider', 'dispute-studio:' || p_ref, null, '{}'::jsonb
    ));
    return notes;
  end if;

  if p_event in ('provider_approved', 'provider_changes', 'provider_rejected') then
    if not private.is_admin() then
      raise exception 'Not allowed' using errcode = 'P0001';
    end if;
    select owner.user_id, pr.name into owner_uid, provider_name
    from public.providers pr
    left join public.profiles owner on owner.id = pr.owner_profile_id
    where pr.slug = p_ref;
    notes := private.push_note(notes, private.insert_notice(
      owner_uid,
      p_event,
      case p_event
        when 'provider_approved' then 'You’re live on Beauty Wallet'
        when 'provider_changes' then 'A change is needed'
        else 'Update on your application'
      end,
      coalesce(provider_name, 'Your studio') || case p_event
        when 'provider_approved' then ' can take bookings now.'
        when 'provider_changes' then ' needs a change before it can go live.'
        else ' was not approved.'
      end,
      case when p_event = 'provider_approved' then '/provider' else '/providers/status' end,
      p_event || ':' || p_ref,
      null, '{}'::jsonb
    ));
    return notes;
  end if;

  if p_event = 'gift_sent' then
    select g.coins, g.to_name, g.from_name, recipient.user_id
      into coins, member_name, provider_name, member_uid
    from public.gifts g
    left join public.profiles recipient on lower(recipient.email) = lower(g.to_email)
    where g.id::text = p_ref
      and g.created_at > now() - interval '30 minutes';
    notes := private.push_note(notes, private.insert_notice(
      member_uid, 'gift',
      split_part(coalesce(provider_name, 'Someone'), ' ', 1) || ' sent you ' || coalesce(coins, 0) || ' coins',
      'Open the gift to add them to your wallet.',
      '/join', 'gift:' || p_ref, null, '{}'::jsonb
    ));
    return notes;
  end if;

  raise exception 'Unknown notice' using errcode = 'P0001';
end;
$$;

revoke all on function public.record_notice(text, text) from public, anon;
grant execute on function public.record_notice(text, text) to authenticated;

create function public.push_tokens_for(p_user_ids uuid[])
returns table (token text, user_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret text;
  header text;
begin
  select value into secret from private.internal_config where key = 'notify_secret';
  header := coalesce(current_setting('request.headers', true)::json->>'x-notify-secret', '');
  if secret is null or header = '' or header <> secret then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  return query
  select d.token, d.user_id
  from public.push_devices d
  where d.user_id = any(coalesce(p_user_ids, '{}'::uuid[]));
end;
$$;

revoke all on function public.push_tokens_for(uuid[]) from public;
grant execute on function public.push_tokens_for(uuid[]) to anon, authenticated;

create function public.forget_push_tokens(p_tokens text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret text;
  header text;
begin
  select value into secret from private.internal_config where key = 'notify_secret';
  header := coalesce(current_setting('request.headers', true)::json->>'x-notify-secret', '');
  if secret is null or header = '' or header <> secret then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  delete from public.push_devices where token = any(coalesce(p_tokens, '{}'::text[]));
end;
$$;

revoke all on function public.forget_push_tokens(text[]) from public;
grant execute on function public.forget_push_tokens(text[]) to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
