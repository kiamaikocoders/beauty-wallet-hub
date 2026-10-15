-- Pricing helper shared by seed data and booking functions.
-- Coins for one service = walk-in Ksh / Ksh per coin, less the member's plan
-- discount, plus the unlock fee when a Basic member books a higher class.
-- Intermediate members must upgrade to book Premium-class providers.
create function private.service_coins(cash_ksh integer, member_tier public.tier_id, provider_class public.tier_id)
returns integer
language plpgsql stable set search_path = ''
as $$
declare
  rules public.coin_rules;
  member_discount numeric;
  fee numeric := 0;
begin
  select * into rules from public.coin_rules where id = 1;
  select discount into member_discount from public.tiers where id = member_tier;
  if member_tier < provider_class then
    if member_tier <> 'basic' then
      raise exception 'Upgrade to book % providers', provider_class using errcode = 'P0001';
    end if;
    fee := rules.unlock_fee_pct;
  end if;
  return round(cash_ksh::numeric / rules.ksh_per_coin * (1 - member_discount) * (1 + fee));
end;
$$;
revoke all on function private.service_coins(integer, public.tier_id, public.tier_id) from public;

-- Plans, rules and catalogue ---------------------------------------------------------

insert into public.coin_rules (id) values (1);

insert into public.tiers (id, name, price_ksh, monthly_coins, discount, badge, sort, perks) values
  ('basic', 'Basic', 7000, 700, 0, null, 1, array[
    'Budget salons, barbers and freelancers', 'Standard booking and walk-ins',
    'Convenience add-ons at standard coin cost', 'Top up coins anytime', '10% of unused coins roll over']),
  ('intermediate', 'Intermediate', 15000, 1500, 0.12, 'Most popular', 2, array[
    'Basic + intermediate studios', 'Priority booking', '12% fewer coins on every service', 'Cheaper convenience add-ons']),
  ('premium', 'Premium', 20000, 2000, 0.18, 'Best value', 3, array[
    'Every provider, incl. premium spaces', 'Fast-track with multiple professionals',
    'Home and office visits, meal options', '18% fewer coins on every service']);

insert into public.payout_bands (class, min_pct, max_pct, default_pct) values
  ('basic', 0.82, 0.88, 0.85),
  ('intermediate', 0.77, 0.83, 0.80),
  ('premium', 0.72, 0.78, 0.75);

insert into public.categories (slug, name, sort) values
  ('hair', 'Hair', 1), ('braids-locs', 'Braids & locs', 2), ('barber', 'Barber', 3), ('nails', 'Nails', 4),
  ('skin', 'Skin & facials', 5), ('makeup', 'Makeup', 6), ('massage', 'Massage & spa', 7), ('lashes-brows', 'Lashes & brows', 8);

insert into public.addons (id, label, coins, sort) values
  ('priority', 'Priority slot (skip queue)', 30, 1),
  ('refreshments', 'Complimentary drink & snack', 15, 2),
  ('home-visit', 'Home / office visit', 120, 3);

-- Providers --------------------------------------------------------------------------

insert into public.providers
  (slug, name, area, kind, about, class, payout_pct, status, verified, home_visits, rating, review_count, owner_name, kyc_docs, payout_method, applied_at, hours)
select v.slug, v.name, v.area, v.kind, v.about, v.class::public.tier_id, b.default_pct, v.status::public.provider_status,
  v.status = 'live', v.home_visits, v.rating, v.review_count, v.owner_name, v.kyc_docs, v.payout_method,
  v.applied_at::timestamptz, v.hours::jsonb
from (values
  ('kinyozi-republic', 'Kinyozi Republic', 'Westlands', 'Barbershop',
    'Westlands barbers known for sharp fades, clean line-ups and a hot towel finish.',
    'basic', 'live', false, 4.7, 186, 'Peter Mwangi', array['Business permit', 'KRA PIN'], 'M-Pesa Till 552190', '2026-07-02 10:00+03',
    '[{"days":"Mon – Fri","open":"8:00","close":"20:00"},{"days":"Saturday","open":"8:00","close":"20:00"},{"days":"Sunday","open":"10:00","close":"16:00"}]'),
  ('polished-kilimani', 'Polished Kilimani', 'Kilimani', 'Nail studio',
    'A bright nail bar on Argwings Kodhek Road for gel, acrylics and quick tidy-ups.',
    'basic', 'live', false, 4.5, 94, 'Njeri Kamau', array['Business permit', 'KRA PIN'], 'M-Pesa Till 618342', '2026-06-04 10:00+03',
    '[{"days":"Mon – Fri","open":"9:00","close":"19:00"},{"days":"Saturday","open":"9:00","close":"18:00"},{"days":"Sunday","open":"Closed","close":""}]'),
  ('crown-atelier', 'Crown Atelier', 'Kilimani', 'Hair and skin studio',
    'Silk presses, treatments and facials in a calm Kilimani studio.',
    'intermediate', 'live', false, 4.7, 143, 'Wambui Kariuki', array['Business permit', 'KRA PIN', 'Health cert'], 'Equity Bank ••4410', '2026-06-18 10:00+03',
    '[{"days":"Mon – Fri","open":"9:00","close":"19:00"},{"days":"Saturday","open":"8:00","close":"18:00"},{"days":"Sunday","open":"Closed","close":""}]'),
  ('braid-bar-ngong-rd', 'Braid Bar Ngong Rd', 'Kilimani', 'Braiding salon',
    'Knotless braids, cornrows and protective styles by a team of six braiders.',
    'intermediate', 'live', false, 4.8, 231, 'Mercy Wambui', array['Business permit', 'KRA PIN'], 'Co-op Bank ••7215', '2026-05-12 10:00+03',
    '[{"days":"Mon – Fri","open":"7:00","close":"20:00"},{"days":"Saturday","open":"7:00","close":"20:00"},{"days":"Sunday","open":"9:00","close":"17:00"}]'),
  ('the-karen-retreat', 'The Karen Retreat', 'Karen', 'Spa and skin clinic',
    'A garden spa on the edge of Karen forest. Our therapists specialise in results-driven facials and deep, unhurried massage, using Kenyan botanicals wherever we can.',
    'premium', 'live', true, 4.9, 212, 'Aisha Hassan', array['Business permit', 'KRA PIN', 'Health cert'], 'KCB ••9021', '2026-05-30 10:00+03',
    '[{"days":"Mon – Fri","open":"9:00","close":"19:00"},{"days":"Saturday","open":"8:00","close":"18:00"},{"days":"Sunday","open":"10:00","close":"16:00"}]'),
  ('gentry-mobile', 'Gentry Mobile', 'Westlands', 'Mobile grooming',
    'Barbers who come to your home or office with everything they need.',
    'premium', 'live', true, 4.8, 67, 'Samuel Kibet', array['Business permit', 'KRA PIN'], 'M-Pesa 0722 ••• 913', '2026-07-20 10:00+03',
    '[{"days":"Mon – Fri","open":"7:00","close":"21:00"},{"days":"Saturday","open":"7:00","close":"21:00"},{"days":"Sunday","open":"9:00","close":"18:00"}]'),
  ('glow-studio-lavington', 'Glow Studio Lavington', 'Lavington', 'Makeup and brow studio',
    'Soft glam, event makeup and brows, with a shade card for every skin tone.',
    'basic', 'live', false, 4.6, 88, 'Wanjiku Ndegwa', array['Business permit', 'KRA PIN'], 'Stanbic ••5520', '2026-08-03 10:00+03',
    '[{"days":"Mon – Fri","open":"9:00","close":"19:00"},{"days":"Saturday","open":"8:00","close":"19:00"},{"days":"Sunday","open":"10:00","close":"16:00"}]'),
  ('the-gentlemens-chair', 'The Gentlemen’s Chair', 'Kileleshwa', 'Barbershop',
    'A classic barbershop for executive cuts, straight-razor shaves and beard care.',
    'intermediate', 'live', false, 4.9, 129, 'James Mutua', array['Business permit', 'KRA PIN'], 'M-Pesa Till 774120', '2026-06-22 10:00+03',
    '[{"days":"Mon – Fri","open":"8:00","close":"20:00"},{"days":"Saturday","open":"8:00","close":"20:00"},{"days":"Sunday","open":"Closed","close":""}]'),
  ('roots-natural-studio', 'Roots Natural Studio', 'CBD', 'Natural hair studio',
    'Locs, retwists and natural styling in the heart of town.',
    'basic', 'live', false, 4.6, 75, 'Akinyi Odhiambo', array['Business permit', 'KRA PIN'], 'M-Pesa Till 330981', '2026-08-15 10:00+03',
    '[{"days":"Mon – Fri","open":"8:00","close":"19:00"},{"days":"Saturday","open":"8:00","close":"19:00"},{"days":"Sunday","open":"Closed","close":""}]'),
  ('fade-lab-lavington', 'Fade Lab Lavington', 'Lavington', 'Barbershop',
    'A new Lavington barbershop for fades and kids’ cuts.',
    'basic', 'applied', false, null, 0, 'Dennis Ochieng', array['Business permit', 'KRA PIN'], 'M-Pesa 0712 ••• 448', '2026-10-08 10:00+03', '[]'),
  ('lumiere-skin-studio', 'Lumière Skin Studio', 'Westlands', 'Skin studio',
    'Brightening facials and skin consultations in Westlands.',
    'intermediate', 'applied', false, null, 0, 'Nadia Patel', array['Business permit', 'Health cert'], 'NCBA ••3302', '2026-10-09 10:00+03', '[]')
) as v(slug, name, area, kind, about, class, status, home_visits, rating, review_count, owner_name, kyc_docs, payout_method, applied_at, hours)
join public.payout_bands b on b.class = v.class::public.tier_id;

insert into public.services (provider_id, name, category, section, cash_ksh, minutes, sort)
select p.id, s.name, s.category, s.section, s.cash_ksh, s.minutes, s.sort
from (values
  ('kinyozi-republic', 'Classic Cut & Line-up', 'barber', 'Cuts', 800, 40, 1),
  ('kinyozi-republic', 'Skin Fade & Line-up', 'barber', 'Cuts', 800, 40, 2),
  ('kinyozi-republic', 'Beard Sculpt & Hot Towel', 'barber', 'Beard', 600, 30, 3),
  ('polished-kilimani', 'Gel Manicure', 'nails', 'Hands', 1500, 50, 1),
  ('crown-atelier', 'Silk Press & Trim', 'hair', 'Hair', 3500, 120, 1),
  ('crown-atelier', 'Wash & Treatment', 'hair', 'Hair', 1500, 45, 2),
  ('crown-atelier', 'Deep Cleanse Facial', 'skin', 'Skin', 4000, 60, 3),
  ('braid-bar-ngong-rd', 'Knotless Braids, Medium', 'braids-locs', 'Braids', 6000, 300, 1),
  ('braid-bar-ngong-rd', 'Knotless Braids, Small', 'braids-locs', 'Braids', 8000, 360, 2),
  ('the-karen-retreat', 'Signature Hydra Facial', 'skin', 'Facials', 9000, 75, 1),
  ('the-karen-retreat', 'Express Glow Facial', 'skin', 'Facials', 5000, 45, 2),
  ('the-karen-retreat', 'Hot Stone Massage', 'massage', 'Massage', 12000, 90, 3),
  ('the-karen-retreat', 'Deep Tissue Massage', 'massage', 'Massage', 8000, 60, 4),
  ('the-karen-retreat', 'Body Scrub & Wrap', 'massage', 'Body', 7500, 75, 5),
  ('gentry-mobile', 'At-Home Groom Package', 'barber', 'Packages', 5500, 80, 1),
  ('glow-studio-lavington', 'Soft Glam Makeup', 'makeup', 'Makeup', 4000, 60, 1),
  ('glow-studio-lavington', 'Brow Shape & Tint', 'lashes-brows', 'Brows', 1800, 40, 2),
  ('the-gentlemens-chair', 'Hot Towel Beard Sculpt', 'barber', 'Beard', 2500, 45, 1),
  ('the-gentlemens-chair', 'Executive Cut & Shave', 'barber', 'Cuts', 3500, 60, 2),
  ('roots-natural-studio', 'Loc Retwist & Style', 'braids-locs', 'Locs', 3000, 120, 1),
  ('roots-natural-studio', 'Cornrows, Straight Back', 'braids-locs', 'Braids', 2200, 90, 2),
  ('fade-lab-lavington', 'Skin Fade', 'barber', 'Cuts', 700, 40, 1),
  ('lumiere-skin-studio', 'Brightening Facial', 'skin', 'Facials', 4500, 60, 1)
) as s(provider_slug, name, category, section, cash_ksh, minutes, sort)
join public.providers p on p.slug = s.provider_slug;

-- Members ------------------------------------------------------------------------------

insert into public.profiles (full_name, area, role, tier, status, renews_on, created_at)
select m.full_name, m.area, 'member', m.tier::public.tier_id, m.status::public.member_status, m.renews_on::date, m.joined::timestamptz
from (values
  ('Amani Wanjiru', 'Kilimani', 'intermediate', 'active', '2026-11-01', '2026-03-01 09:00+03'),
  ('Brian Otieno', 'Westlands', 'basic', 'active', '2026-11-01', '2026-04-11 09:00+03'),
  ('Peter Mwangi', 'Lavington', 'premium', 'active', '2026-10-14', '2026-02-14 09:00+03'),
  ('Lilian Mwangi', 'Kileleshwa', 'premium', 'active', '2026-10-22', '2026-05-22 09:00+03'),
  ('Sheila Otieno', 'Kileleshwa', 'intermediate', 'active', '2026-10-19', '2026-06-19 09:00+03'),
  ('Kevin Odera', 'South B', 'basic', 'renewal_failed', '2026-10-08', '2026-07-08 09:00+03'),
  ('Grace Muthoni', 'Westlands', 'basic', 'active', '2026-11-03', '2026-08-03 09:00+03'),
  ('Kevin Kamau', 'Westlands', 'basic', 'active', '2026-11-05', '2026-05-05 09:00+03'),
  ('Faith Njeri', 'Parklands', 'basic', 'active', '2026-10-28', '2026-06-28 09:00+03'),
  ('Liam Odhiambo', 'Kilimani', 'intermediate', 'active', '2026-10-30', '2026-04-30 09:00+03'),
  ('Ruth Njoroge', 'Kilimani', 'intermediate', 'active', '2026-10-25', '2026-07-25 09:00+03'),
  ('Joy Akinyi', 'CBD', 'basic', 'active', '2026-10-27', '2026-08-27 09:00+03'),
  ('Mary Atieno', 'Kilimani', 'intermediate', 'active', '2026-11-02', '2026-05-02 09:00+03'),
  ('Daniel Kiprop', 'Upper Hill', 'intermediate', 'active', '2026-11-01', '2026-09-01 09:00+03'),
  ('Esther Wangari', 'Karen', 'premium', 'active', '2026-10-20', '2026-03-20 09:00+03')
) as m(full_name, area, tier, status, renews_on, joined);

insert into public.wallets (profile_id) select id from public.profiles where role = 'member';

-- Bookings -------------------------------------------------------------------------
-- "today" rows are anchored to the day the seed runs (Nairobi time); past rows use fixed dates.

create temporary table seed_bookings (
  ref text primary key, member text, provider_slug text, services text[], addons text[],
  scheduled_at timestamptz, status public.booking_status, pin text
);

insert into seed_bookings values
  ('b1', 'Brian Otieno', 'kinyozi-republic', array['Classic Cut & Line-up', 'Beard Sculpt & Hot Towel'], '{}', (current_date + time '10:00') at time zone 'Africa/Nairobi', 'booked', '5932'),
  ('b2', 'Grace Muthoni', 'kinyozi-republic', array['Classic Cut & Line-up'], array['priority'], (current_date + time '11:30') at time zone 'Africa/Nairobi', 'booked', '3307'),
  ('b3', 'Kevin Kamau', 'kinyozi-republic', array['Beard Sculpt & Hot Towel'], '{}', (current_date + time '09:00') at time zone 'Africa/Nairobi', 'in_progress', '9150'),
  ('b4', 'Faith Njeri', 'kinyozi-republic', array['Classic Cut & Line-up'], '{}', (current_date + time '08:15') at time zone 'Africa/Nairobi', 'done', '1188'),
  ('b5', 'Liam Odhiambo', 'crown-atelier', array['Deep Cleanse Facial'], '{}', (current_date - 1 + time '15:00') at time zone 'Africa/Nairobi', 'done', '7741'),
  ('b6', 'Amani Wanjiru', 'crown-atelier', array['Silk Press & Trim'], '{}', (current_date + time '14:00') at time zone 'Africa/Nairobi', 'booked', '4821'),
  ('b7', 'Ruth Njoroge', 'braid-bar-ngong-rd', array['Knotless Braids, Medium'], '{}', (current_date + time '13:00') at time zone 'Africa/Nairobi', 'booked', '7306'),
  ('b8', 'Sheila Otieno', 'crown-atelier', array['Wash & Treatment'], '{}', (current_date + time '11:30') at time zone 'Africa/Nairobi', 'arriving', '2614'),
  ('b9', 'Peter Mwangi', 'the-gentlemens-chair', array['Executive Cut & Shave'], '{}', (current_date + time '10:30') at time zone 'Africa/Nairobi', 'in_progress', '8075'),
  ('b10', 'Joy Akinyi', 'roots-natural-studio', array['Cornrows, Straight Back'], '{}', (current_date + time '09:00') at time zone 'Africa/Nairobi', 'done', '4410'),
  ('b11', 'Grace Muthoni', 'polished-kilimani', array['Gel Manicure'], '{}', (current_date + time '08:30') at time zone 'Africa/Nairobi', 'no_show', '6629'),
  ('b12', 'Lilian Mwangi', 'braid-bar-ngong-rd', array['Knotless Braids, Small'], '{}', (current_date + time '08:00') at time zone 'Africa/Nairobi', 'in_progress', '3958'),
  ('b13', 'Amani Wanjiru', 'glow-studio-lavington', array['Brow Shape & Tint'], '{}', '2026-10-07 10:00+03', 'done', '1207'),
  ('b14', 'Mary Atieno', 'polished-kilimani', array['Gel Manicure'], '{}', '2026-10-13 16:00+03', 'done', '5583'),
  ('b15', 'Daniel Kiprop', 'kinyozi-republic', array['Skin Fade & Line-up'], '{}', '2026-10-08 18:00+03', 'done', '2390'),
  ('b16', 'Esther Wangari', 'the-karen-retreat', array['Hot Stone Massage'], '{}', '2026-10-06 11:00+03', 'done', '6418');

create temporary table seed_priced as
select sb.ref, m.id as member_id, p.id as provider_id, sb.scheduled_at, sb.status, sb.pin, sb.addons,
  s.id as service_id, s.cash_ksh,
  private.service_coins(s.cash_ksh, m.tier, p.class) as coins,
  p.payout_pct
from seed_bookings sb
join public.profiles m on m.full_name = sb.member and m.role = 'member'
join public.providers p on p.slug = sb.provider_slug
join public.services s on s.provider_id = p.id and s.name = any (sb.services);

create temporary table seed_totals as
select sp.ref, sp.member_id, sp.provider_id, sp.scheduled_at, sp.status, sp.pin, sp.addons,
  (case when count(*) >= 2
     then round(sum(sp.coins) * (1 - (select group_savings_pct from public.coin_rules where id = 1)))
     else sum(sp.coins) end)::integer
   + coalesce((select sum(a.coins) from public.addons a where a.id = any (sp.addons)), 0)::integer as coins,
  sum(sp.cash_ksh)::integer as cash_ksh,
  round(sum(sp.cash_ksh) * max(sp.payout_pct))::integer as payout_ksh,
  gen_random_uuid() as booking_id
from seed_priced sp
group by sp.ref, sp.member_id, sp.provider_id, sp.scheduled_at, sp.status, sp.pin, sp.addons;

insert into public.bookings (id, member_profile_id, provider_id, scheduled_at, status, coins, cash_ksh, payout_ksh, addons, created_at)
select t.booking_id, t.member_id, t.provider_id, t.scheduled_at, t.status, t.coins, t.cash_ksh, t.payout_ksh,
  coalesce((select array_agg(a.label order by a.sort) from public.addons a where a.id = any (t.addons)), '{}'),
  least(t.scheduled_at - interval '2 days', now())
from seed_totals t;

insert into public.booking_items (booking_id, service_id, cash_ksh, coins)
select t.booking_id, sp.service_id, sp.cash_ksh, sp.coins
from seed_totals t join seed_priced sp on sp.ref = t.ref;

insert into public.booking_pins (booking_id, pin)
select booking_id, pin from seed_totals;

-- Coin ledger and wallets ----------------------------------------------------------------
-- Each active member got this month's allowance on 1 Oct; Amani also rolled 70 coins over.
-- Every booking holds its coins; the wallet totals are derived from the ledger.

insert into public.coin_transactions (profile_id, kind, coins, note, created_at)
select p.id, 'allowance', t.monthly_coins, t.name || ' plan, October', '2026-10-01 00:05+03'
from public.profiles p join public.tiers t on t.id = p.tier
where p.role = 'member' and p.status = 'active';

insert into public.coin_transactions (profile_id, kind, coins, note, created_at)
select id, 'rollover', 70, '10% of September’s unused coins', '2026-10-01 00:05+03'
from public.profiles where full_name = 'Amani Wanjiru';

insert into public.coin_transactions (profile_id, booking_id, kind, coins, note, created_at)
select b.member_profile_id, b.id, 'hold', -b.coins, p.name, b.created_at
from public.bookings b join public.providers p on p.id = b.provider_id;

update public.wallets w set
  available = coalesce((select sum(c.coins) from public.coin_transactions c where c.profile_id = w.profile_id), 0),
  on_hold = coalesce((select sum(b.coins) from public.bookings b
    where b.member_profile_id = w.profile_id and b.status in ('booked', 'arriving', 'in_progress')), 0),
  rollover = case when exists (select 1 from public.profiles p where p.id = w.profile_id and p.full_name = 'Amani Wanjiru') then 70 else 0 end,
  updated_at = now();

-- Disputes and reviews -------------------------------------------------------------------

insert into public.disputes (code, booking_id, raised_by_profile_id, reason, member_message, provider_message, status, created_at)
select d.code, t.booking_id, t.member_id, d.reason, d.member_message, d.provider_message, d.status::public.dispute_status, d.created_at
from (values
  ('D-1035', 'b16', 'Service was cut short', 'The massage finished 30 minutes early and the room was cold.', 'We are sorry. We can offer a free 30-minute top-up session.', 'waiting_member', timestamptz '2026-10-06 15:20+03'),
  ('D-1038', 'b15', 'Service wasn’t what I booked', 'I asked for a skin fade and got a regular taper.', null, 'waiting_provider', timestamptz '2026-10-08 19:10+03'),
  ('D-1039', 'b14', 'Quality problem', 'Two nails chipped the next morning.', null, 'new', now() - interval '26 hours'),
  ('D-1041', 'b5', 'Reaction after the facial', 'My skin was red and itchy for two days after the deep cleanse.', null, 'waiting_provider', now() - interval '20 hours'),
  ('D-1042', 'b13', 'Service wasn’t what I booked', 'The tint came out much darker than the shade we agreed on.', 'We showed Amani the shade card and she chose it. We’re happy to redo the tint for free this week.', 'new', now() - interval '1 hour')
) as d(code, ref, reason, member_message, provider_message, status, created_at)
join seed_totals t on t.ref = d.ref;

select setval('public.dispute_number_seq', 1042);

insert into public.reviews (provider_id, author_name, author_tier, rating, body, created_at)
select p.id, r.author_name, r.author_tier::public.tier_id, r.rating, r.body, r.created_at::timestamptz
from (values
  ('the-karen-retreat', 'Wanjiru N.', 'premium', 5, 'The hydra facial was the calmest 75 minutes of my month. Checked in with my PIN and never touched my wallet.', '2026-09-18 12:00+03'),
  ('the-karen-retreat', 'Kevin O.', 'premium', 5, 'Booked a hot stone massage for my wife and me. Spotless rooms, on time, and the garden view is unreal.', '2026-08-23 12:00+03'),
  ('kinyozi-republic', 'Brian O.', 'basic', 5, 'My fade every two weeks and a beard sculpt, sorted for the month. The barber gets paid, I just show my PIN.', '2026-09-26 12:00+03'),
  ('braid-bar-ngong-rd', 'Amani W.', 'intermediate', 5, 'Neat, light knotless braids and they finished right on time.', '2026-09-12 12:00+03'),
  ('crown-atelier', 'Sheila O.', 'intermediate', 4, 'Lovely silk press that lasted two weeks. Booking was easy.', '2026-09-30 12:00+03'),
  ('the-gentlemens-chair', 'Peter M.', 'premium', 5, 'Best straight-razor shave in Nairobi. Worth every coin.', '2026-10-03 12:00+03')
) as r(provider_slug, author_name, author_tier, rating, body, created_at)
join public.providers p on p.slug = r.provider_slug;

drop table seed_totals, seed_priced, seed_bookings;
