-- Studio and member pins, booking messages, and a stored visit clock.

alter table public.providers
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists address_text text;

alter table public.profiles
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists address_text text;

alter table public.bookings
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists promised_minutes integer;

create table if not exists public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  sender_profile_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now(),
  constraint booking_messages_body_len check (char_length(btrim(body)) between 1 and 1000)
);

alter table public.booking_messages enable row level security;

drop policy if exists "Participants read booking messages" on public.booking_messages;
create policy "Participants read booking messages"
  on public.booking_messages for select to authenticated
  using (
    booking_id in (select private.visible_booking_ids())
    or (select private.is_admin())
  );

update public.providers p
set
  location_lat = (case lower(btrim(p.area))
    when 'westlands' then -1.2673
    when 'kilimani' then -1.2921
    when 'karen' then -1.3197
    when 'lavington' then -1.2833
    when 'kileleshwa' then -1.2805
    when 'cbd' then -1.2864
    else -1.2921
  end) + ((hashtext(p.id::text) % 40) / 10000.0),
  location_lng = (case lower(btrim(p.area))
    when 'westlands' then 36.8110
    when 'kilimani' then 36.7870
    when 'karen' then 36.7080
    when 'lavington' then 36.7690
    when 'kileleshwa' then 36.7875
    when 'cbd' then 36.8172
    else 36.8219
  end) + ((hashtext(p.slug) % 40) / 10000.0),
  address_text = coalesce(p.address_text, p.area || ', Nairobi')
where p.location_lat is null;

update public.profiles pr
set
  location_lat = (case lower(btrim(pr.area))
    when 'westlands' then -1.2673
    when 'kilimani' then -1.2921
    when 'karen' then -1.3197
    when 'lavington' then -1.2833
    when 'kileleshwa' then -1.2805
    when 'cbd' then -1.2864
    else -1.2921
  end) + ((hashtext(pr.id::text) % 50) / 10000.0),
  location_lng = (case lower(btrim(pr.area))
    when 'westlands' then 36.8110
    when 'kilimani' then 36.7870
    when 'karen' then 36.7080
    when 'lavington' then 36.7690
    when 'kileleshwa' then 36.7875
    when 'cbd' then 36.8172
    else 36.8219
  end) + ((hashtext(coalesce(pr.email, pr.id::text)) % 50) / 10000.0),
  address_text = coalesce(pr.address_text, pr.area || ', Nairobi')
where pr.role = 'member'
  and pr.area is not null
  and pr.location_lat is null;
