drop function if exists public.apply_as_provider(
  text, text, text, text, text, text, boolean, text, text, text, text, text, text[]
);

create function public.apply_as_provider(
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
  v_email text := trim(p_email);
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

  insert into public.providers (
    slug, name, area, kind, about, class, payout_pct, status, verified,
    home_visits, owner_name, kyc_docs, payout_method, application_ref, applied_at,
    location_lat, location_lng, address_text
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
    v_address
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

revoke all on function public.apply_as_provider(
  text, text, text, text, text, text, boolean, text, text, text, text, text, text[], double precision, double precision, text
) from public;

grant execute on function public.apply_as_provider(
  text, text, text, text, text, text, boolean, text, text, text, text, text, text[], double precision, double precision, text
) to anon, authenticated;

create or replace function public.save_my_location(
  p_lat double precision,
  p_lng double precision,
  p_address text,
  p_area text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_lat is null or p_lng is null or p_lat < -5 or p_lat > 5 or p_lng < 33 or p_lng > 42 then
    raise exception 'pin must be in Kenya';
  end if;
  update public.profiles
  set location_lat = p_lat,
      location_lng = p_lng,
      address_text = nullif(btrim(coalesce(p_address, '')), ''),
      area = nullif(btrim(coalesce(p_area, '')), '')
  where user_id = auth.uid();
  if not found then
    raise exception 'profile missing';
  end if;
end;
$$;

revoke all on function public.save_my_location(double precision, double precision, text, text) from public;
grant execute on function public.save_my_location(double precision, double precision, text, text) to authenticated;
