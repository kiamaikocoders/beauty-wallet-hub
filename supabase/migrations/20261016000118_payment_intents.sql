-- Onboarding payment intents: RLS on, no anon policies; writes via SECURITY DEFINER RPC.

create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  profile_id uuid references public.profiles (id) on delete set null,
  tier public.tier_id not null,
  amount_ksh integer not null check (amount_ksh > 0),
  method text not null check (method in ('mpesa', 'card')),
  phone text,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  reference text not null unique,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.payment_intents enable row level security;

create sequence if not exists public.payment_ref_seq
  as integer
  start with 58000
  increment by 1
  owned by none;

create or replace function public.create_payment_intent(
  p_tier text,
  p_amount_ksh integer,
  p_method text,
  p_phone text default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier public.tier_id;
  v_method text := lower(trim(p_method));
  v_phone text := nullif(trim(coalesce(p_phone, '')), '');
  v_uid uuid := auth.uid();
  v_profile uuid;
  v_ref text;
  v_id uuid;
begin
  begin
    v_tier := lower(trim(p_tier))::public.tier_id;
  exception when others then
    raise exception 'invalid tier';
  end;

  if p_amount_ksh is null or p_amount_ksh <= 0 or p_amount_ksh > 500000 then
    raise exception 'invalid amount';
  end if;

  if v_method not in ('mpesa', 'card') then
    raise exception 'invalid method';
  end if;

  if v_method = 'mpesa' and (v_phone is null or char_length(v_phone) < 7 or char_length(v_phone) > 32) then
    raise exception 'invalid phone';
  end if;

  if v_uid is not null then
    select p.id into v_profile from public.profiles p where p.user_id = v_uid limit 1;
  end if;

  v_ref := 'BW-PAY-' || nextval('public.payment_ref_seq')::text;

  insert into public.payment_intents (
    user_id, profile_id, tier, amount_ksh, method, phone, status, reference, metadata
  ) values (
    v_uid, v_profile, v_tier, p_amount_ksh, v_method, v_phone, 'pending', v_ref,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'reference', v_ref,
    'status', 'pending',
    'tier', v_tier,
    'amount_ksh', p_amount_ksh,
    'method', v_method
  );
end;
$$;

create or replace function public.update_payment_intent_status(
  p_id uuid,
  p_status text,
  p_failure_reason text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text := lower(trim(p_status));
  v_row public.payment_intents%rowtype;
begin
  if v_status not in ('pending', 'processing', 'succeeded', 'failed', 'cancelled') then
    raise exception 'invalid status';
  end if;

  update public.payment_intents
  set
    status = v_status,
    failure_reason = case when v_status = 'failed' then nullif(trim(coalesce(p_failure_reason, '')), '') else failure_reason end,
    updated_at = now()
  where id = p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'not found';
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'reference', v_row.reference,
    'status', v_row.status,
    'tier', v_row.tier,
    'amount_ksh', v_row.amount_ksh,
    'method', v_row.method
  );
end;
$$;

revoke all on function public.create_payment_intent(text, integer, text, text, jsonb) from public;
revoke all on function public.update_payment_intent_status(uuid, text, text) from public;
grant execute on function public.create_payment_intent(text, integer, text, text, jsonb) to anon, authenticated;
grant execute on function public.update_payment_intent_status(uuid, text, text) to anon, authenticated;

revoke all on table public.payment_intents from anon, authenticated;
