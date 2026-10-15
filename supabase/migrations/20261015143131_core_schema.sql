-- Beauty Wallet core schema: plans, coin rules, providers, services, members,
-- wallets, bookings, reviews and disputes.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.tier_id as enum ('basic', 'intermediate', 'premium');
create type public.app_role as enum ('member', 'provider', 'admin', 'hr');
create type public.member_status as enum ('active', 'renewal_failed', 'cancelled');
create type public.provider_status as enum ('applied', 'live', 'paused', 'rejected');
create type public.booking_status as enum ('booked', 'arriving', 'in_progress', 'done', 'cancelled', 'no_show');
create type public.dispute_status as enum ('new', 'waiting_provider', 'waiting_member', 'resolved');

-- Plans and pricing rules ---------------------------------------------------

create table public.tiers (
  id public.tier_id primary key,
  name text not null,
  price_ksh integer not null check (price_ksh > 0),
  monthly_coins integer not null check (monthly_coins > 0),
  discount numeric(4, 3) not null check (discount >= 0 and discount < 1),
  badge text,
  perks text[] not null default '{}',
  sort smallint not null
);

create table public.coin_rules (
  id smallint primary key default 1 check (id = 1),
  ksh_per_coin integer not null default 10,
  rollover_pct numeric(4, 3) not null default 0.10,
  rollover_months smallint not null default 1,
  unlock_fee_pct numeric(4, 3) not null default 0.10,
  margin_floor_pct numeric(4, 3) not null default 0.05,
  group_savings_pct numeric(4, 3) not null default 0.08,
  updated_at timestamptz not null default now()
);

create table public.payout_bands (
  class public.tier_id primary key,
  min_pct numeric(4, 3) not null,
  max_pct numeric(4, 3) not null,
  default_pct numeric(4, 3) not null,
  check (min_pct <= default_pct and default_pct <= max_pct)
);

create table public.categories (
  slug text primary key,
  name text not null,
  sort smallint not null
);

create table public.addons (
  id text primary key,
  label text not null,
  coins integer not null check (coins >= 0),
  sort smallint not null default 0
);

-- People ------------------------------------------------------------------------

-- A profile can exist before its person signs up (seeded or invited members),
-- so user_id is nullable and linked once they have an auth account.
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  area text,
  role public.app_role not null default 'member',
  tier public.tier_id,
  status public.member_status not null default 'active',
  renews_on date,
  avatar_url text,
  created_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

create table public.wallets (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  available integer not null default 0 check (available >= 0),
  on_hold integer not null default 0 check (on_hold >= 0),
  rollover integer not null default 0 check (rollover >= 0),
  updated_at timestamptz not null default now()
);

-- Providers and services --------------------------------------------------------

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  area text not null,
  kind text,
  about text,
  class public.tier_id not null,
  payout_pct numeric(4, 3) not null,
  status public.provider_status not null default 'applied',
  verified boolean not null default false,
  home_visits boolean not null default false,
  rating numeric(2, 1),
  review_count integer not null default 0,
  owner_profile_id uuid references public.profiles (id) on delete set null,
  owner_name text,
  kyc_docs text[] not null default '{}',
  payout_method text,
  hours jsonb not null default '[]',
  cover_url text,
  applied_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index providers_status_idx on public.providers (status);
create index providers_owner_idx on public.providers (owner_profile_id);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  name text not null,
  category text not null references public.categories (slug),
  section text,
  cash_ksh integer not null check (cash_ksh > 0),
  minutes integer not null check (minutes > 0),
  active boolean not null default true,
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);
create index services_provider_idx on public.services (provider_id);
create index services_category_idx on public.services (category);

-- Bookings ----------------------------------------------------------------------

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  member_profile_id uuid not null references public.profiles (id),
  provider_id uuid not null references public.providers (id),
  scheduled_at timestamptz not null,
  status public.booking_status not null default 'booked',
  coins integer not null check (coins >= 0),
  cash_ksh integer not null check (cash_ksh >= 0),
  payout_ksh integer not null check (payout_ksh >= 0),
  addons text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index bookings_member_idx on public.bookings (member_profile_id, scheduled_at desc);
create index bookings_provider_idx on public.bookings (provider_id, scheduled_at desc);

create table public.booking_items (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  service_id uuid not null references public.services (id),
  cash_ksh integer not null,
  coins integer not null,
  primary key (booking_id, service_id)
);
create index booking_items_service_idx on public.booking_items (service_id);

-- The arrival PIN lives apart from the booking so providers, who can read
-- their bookings, can never read the PIN they are meant to check.
create table public.booking_pins (
  booking_id uuid primary key references public.bookings (id) on delete cascade,
  pin text not null check (pin ~ '^[0-9]{4}$'),
  updated_at timestamptz not null default now()
);

create table public.coin_transactions (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  kind text not null check (kind in ('allowance', 'top_up', 'hold', 'release', 'refund', 'rollover', 'expiry', 'adjustment')),
  coins integer not null,
  note text,
  created_at timestamptz not null default now()
);
create index coin_transactions_profile_idx on public.coin_transactions (profile_id, created_at desc);
create index coin_transactions_booking_idx on public.coin_transactions (booking_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  booking_id uuid unique references public.bookings (id) on delete set null,
  author_profile_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  author_tier public.tier_id,
  rating smallint not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);
create index reviews_provider_idx on public.reviews (provider_id, created_at desc);
create index reviews_author_idx on public.reviews (author_profile_id);

create sequence public.dispute_number_seq start 1001;
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('D-' || nextval('public.dispute_number_seq')),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  raised_by_profile_id uuid not null references public.profiles (id),
  reason text not null,
  member_message text,
  provider_message text,
  status public.dispute_status not null default 'new',
  outcome text check (outcome in ('redo', 'half_refund', 'full_refund')),
  refund_coins integer,
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index disputes_booking_idx on public.disputes (booking_id);
create index disputes_raised_by_idx on public.disputes (raised_by_profile_id);
create index disputes_status_idx on public.disputes (status);

-- Access helpers (private schema, not exposed through the Data API) ----------------

create function private.current_profile_id() returns uuid
language sql stable security definer set search_path = ''
as $$ select id from public.profiles where user_id = (select auth.uid()) $$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin') $$;

create function private.owned_provider_ids() returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select p.id from public.providers p
  join public.profiles pr on pr.id = p.owner_profile_id
  where pr.user_id = (select auth.uid())
$$;

create function private.visible_booking_ids() returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select b.id from public.bookings b
  where b.member_profile_id = private.current_profile_id()
     or b.provider_id in (select private.owned_provider_ids())
$$;

create function private.visible_member_profile_ids() returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select distinct b.member_profile_id from public.bookings b
  where b.provider_id in (select private.owned_provider_ids())
$$;

revoke all on function private.current_profile_id(), private.is_admin(),
  private.owned_provider_ids(), private.visible_booking_ids(), private.visible_member_profile_ids() from public;
grant execute on function private.current_profile_id(), private.is_admin(),
  private.owned_provider_ids(), private.visible_booking_ids(), private.visible_member_profile_ids() to authenticated;

-- Members and provider owners may edit their own rows, but only admins (or
-- server-side code) may change the fields that control access, pricing or money.
create function private.guard_protected_columns() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') or private.is_admin() then
    return new;
  end if;
  if tg_table_name = 'profiles' and (
    new.user_id, new.email, new.role, new.tier, new.status, new.renews_on
  ) is distinct from (
    old.user_id, old.email, old.role, old.tier, old.status, old.renews_on
  ) then
    raise exception 'Only admins can change plan, role or status' using errcode = '42501';
  end if;
  if tg_table_name = 'providers' and (
    new.slug, new.class, new.payout_pct, new.status, new.verified, new.owner_profile_id, new.rating, new.review_count, new.kyc_docs, new.applied_at
  ) is distinct from (
    old.slug, old.class, old.payout_pct, old.status, old.verified, old.owner_profile_id, old.rating, old.review_count, old.kyc_docs, old.applied_at
  ) then
    raise exception 'Only admins can change class, payout or status' using errcode = '42501';
  end if;
  return new;
end;
$$;
grant execute on function private.guard_protected_columns() to authenticated;

create trigger guard_profile_columns before update on public.profiles
  for each row execute function private.guard_protected_columns();
create trigger guard_provider_columns before update on public.providers
  for each row execute function private.guard_protected_columns();

-- New sign-ups get a member profile and an empty wallet.
create function private.handle_new_user() returns trigger
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
    new.phone
  )
  returning id into new_profile_id;
  insert into public.wallets (profile_id) values (new_profile_id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Row level security ------------------------------------------------------------------

alter table public.tiers enable row level security;
alter table public.coin_rules enable row level security;
alter table public.payout_bands enable row level security;
alter table public.categories enable row level security;
alter table public.addons enable row level security;
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.providers enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
alter table public.booking_pins enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.reviews enable row level security;
alter table public.disputes enable row level security;

-- Public catalogue: readable by everyone, editable by admins.
create policy "Catalogue is public" on public.tiers for select to anon, authenticated using (true);
create policy "Admins manage tiers" on public.tiers for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Coin rules are public" on public.coin_rules for select to anon, authenticated using (true);
create policy "Admins manage coin rules" on public.coin_rules for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Payout bands are public" on public.payout_bands for select to anon, authenticated using (true);
create policy "Admins manage payout bands" on public.payout_bands for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Categories are public" on public.categories for select to anon, authenticated using (true);
create policy "Admins manage categories" on public.categories for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Add-ons are public" on public.addons for select to anon, authenticated using (true);
create policy "Admins manage add-ons" on public.addons for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- Providers: live ones are public; owners see and edit their own; admins see all.
create policy "Live providers are public" on public.providers for select to anon, authenticated using (status = 'live');
create policy "Owners read their providers" on public.providers for select to authenticated using (id in (select private.owned_provider_ids()));
create policy "Owners update their providers" on public.providers for update to authenticated
  using (id in (select private.owned_provider_ids())) with check (id in (select private.owned_provider_ids()));
create policy "Admins manage providers" on public.providers for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Services of live providers are public" on public.services for select to anon, authenticated
  using (provider_id in (select id from public.providers where status = 'live'));
create policy "Owners manage their services" on public.services for all to authenticated
  using (provider_id in (select private.owned_provider_ids())) with check (provider_id in (select private.owned_provider_ids()));
create policy "Admins manage services" on public.services for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- Profiles: people read and edit their own; admins read and edit all.
create policy "Read own profile" on public.profiles for select to authenticated using (user_id = (select auth.uid()));
create policy "Update own profile" on public.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Providers read their customers" on public.profiles for select to authenticated using (id in (select private.visible_member_profile_ids()));
create policy "Admins manage profiles" on public.profiles for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- Wallets and the coin ledger are read-only from the app; coins move in server functions.
create policy "Read own wallet" on public.wallets for select to authenticated using (profile_id = (select private.current_profile_id()));
create policy "Admins read wallets" on public.wallets for select to authenticated using ((select private.is_admin()));
create policy "Read own coin history" on public.coin_transactions for select to authenticated using (profile_id = (select private.current_profile_id()));
create policy "Admins read coin history" on public.coin_transactions for select to authenticated using ((select private.is_admin()));

-- Bookings: the member and the provider's owner can read; admins read all.
create policy "Members and providers read bookings" on public.bookings for select to authenticated using (id in (select private.visible_booking_ids()));
create policy "Admins read bookings" on public.bookings for select to authenticated using ((select private.is_admin()));
create policy "Members and providers read booking items" on public.booking_items for select to authenticated using (booking_id in (select private.visible_booking_ids()));
create policy "Admins read booking items" on public.booking_items for select to authenticated using ((select private.is_admin()));
create policy "Members read their own PINs" on public.booking_pins for select to authenticated
  using (booking_id in (select id from public.bookings where member_profile_id = (select private.current_profile_id())));

create policy "Reviews are public" on public.reviews for select to anon, authenticated using (true);
create policy "Admins manage reviews" on public.reviews for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Parties read their disputes" on public.disputes for select to authenticated using (booking_id in (select private.visible_booking_ids()));
create policy "Admins manage disputes" on public.disputes for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
