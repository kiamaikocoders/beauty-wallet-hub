-- Browser push tokens. Clients cannot insert rows directly; registration goes
-- through private.register_push_device, which reassigns a token to the signed-in user.

create table public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_devices_token_key unique (token),
  constraint push_devices_token_len check (char_length(token) between 20 and 4096)
);

create index push_devices_user_idx on public.push_devices (user_id);

alter table public.push_devices enable row level security;

create policy "Read own push devices"
  on public.push_devices
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Delete own push devices"
  on public.push_devices
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create function private.register_push_device(p_token text, p_user_agent text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if p_token is null or char_length(p_token) < 20 or char_length(p_token) > 4096 then
    raise exception 'Invalid push token';
  end if;
  delete from public.push_devices where token = p_token;
  insert into public.push_devices (user_id, token, user_agent)
  values (uid, p_token, left(coalesce(p_user_agent, ''), 300));
end;
$$;

revoke all on function private.register_push_device(text, text) from public;
grant execute on function private.register_push_device(text, text) to authenticated;

create function public.register_push_device(p_token text, p_user_agent text default null)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.register_push_device(p_token, p_user_agent);
end;
$$;

revoke all on function public.register_push_device(text, text) from public, anon;
grant execute on function public.register_push_device(text, text) to authenticated;
