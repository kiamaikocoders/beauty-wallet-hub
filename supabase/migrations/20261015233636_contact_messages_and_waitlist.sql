-- Contact form + coverage waitlist: tables with RLS on (no anon policies),
-- writes only via SECURITY DEFINER RPCs.

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  who text not null check (who in ('member', 'provider', 'other')),
  full_name text not null,
  phone text not null,
  topic text not null,
  message text not null,
  constraint contact_messages_full_name_len check (char_length(trim(full_name)) between 2 and 120),
  constraint contact_messages_phone_len check (char_length(trim(phone)) between 7 and 32),
  constraint contact_messages_topic_len check (char_length(trim(topic)) between 2 and 80),
  constraint contact_messages_message_len check (char_length(trim(message)) between 10 and 1000)
);

alter table public.contact_messages enable row level security;

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  intent text not null check (intent in ('member', 'provider')),
  area text not null,
  phone text not null,
  constraint waitlist_area_len check (char_length(trim(area)) between 2 and 80),
  constraint waitlist_phone_len check (char_length(trim(phone)) between 7 and 32)
);

alter table public.waitlist enable row level security;

create or replace function public.submit_contact_message(
  p_who text,
  p_full_name text,
  p_phone text,
  p_topic text,
  p_message text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_who text := lower(trim(p_who));
  v_name text := trim(p_full_name);
  v_phone text := trim(p_phone);
  v_topic text := trim(p_topic);
  v_message text := trim(p_message);
begin
  if v_who not in ('member', 'provider', 'other') then
    raise exception 'invalid who';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'invalid full_name';
  end if;
  if char_length(v_phone) < 7 or char_length(v_phone) > 32 then
    raise exception 'invalid phone';
  end if;
  if char_length(v_topic) < 2 or char_length(v_topic) > 80 then
    raise exception 'invalid topic';
  end if;
  if char_length(v_message) < 10 or char_length(v_message) > 1000 then
    raise exception 'invalid message';
  end if;

  insert into public.contact_messages (who, full_name, phone, topic, message)
  values (v_who, v_name, v_phone, v_topic, v_message)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.submit_waitlist(
  p_intent text,
  p_area text,
  p_phone text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_intent text := lower(trim(p_intent));
  v_area text := trim(p_area);
  v_phone text := trim(p_phone);
begin
  if v_intent not in ('member', 'provider') then
    raise exception 'invalid intent';
  end if;
  if char_length(v_area) < 2 or char_length(v_area) > 80 then
    raise exception 'invalid area';
  end if;
  if char_length(v_phone) < 7 or char_length(v_phone) > 32 then
    raise exception 'invalid phone';
  end if;

  insert into public.waitlist (intent, area, phone)
  values (v_intent, v_area, v_phone)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text, text) from public;
revoke all on function public.submit_waitlist(text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;
grant execute on function public.submit_waitlist(text, text, text) to anon, authenticated;

revoke all on table public.contact_messages from anon, authenticated;
revoke all on table public.waitlist from anon, authenticated;
