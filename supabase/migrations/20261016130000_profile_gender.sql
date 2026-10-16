alter table public.profiles
  add column if not exists gender text
  check (gender is null or gender in ('male', 'female', 'rather_not_say'));

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  new_profile_id uuid;
  raw_gender text := nullif(new.raw_user_meta_data ->> 'gender', '');
begin
  if raw_gender is not null and raw_gender not in ('male', 'female', 'rather_not_say') then
    raw_gender := null;
  end if;

  insert into public.profiles (user_id, full_name, email, phone, gender)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1), 'Member'),
    new.email,
    coalesce(new.phone, nullif(new.raw_user_meta_data ->> 'phone', '')),
    raw_gender
  )
  returning id into new_profile_id;
  insert into public.wallets (profile_id) values (new_profile_id);
  return new;
end;
$$;
