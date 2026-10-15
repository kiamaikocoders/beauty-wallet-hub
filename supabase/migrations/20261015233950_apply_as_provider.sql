-- Provider applications: insert into public.providers (status=applied) via SECURITY DEFINER RPC.
-- Anon cannot insert directly (RLS); reference numbers come from a sequence.

alter table public.providers
  add column if not exists application_ref text;

create unique index if not exists providers_application_ref_uidx
  on public.providers (application_ref)
  where application_ref is not null;

create sequence if not exists public.provider_application_ref_seq
  as integer
  start with 2000
  increment by 1
  owned by none;

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
  p_kyc_docs text[] default '{}'::text[]
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
    home_visits, owner_name, kyc_docs, payout_method, application_ref, applied_at
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
    now()
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
  text, text, text, text, text, text, boolean, text, text, text, text, text, text[]
) from public;

grant execute on function public.apply_as_provider(
  text, text, text, text, text, text, boolean, text, text, text, text, text, text[]
) to anon, authenticated;
