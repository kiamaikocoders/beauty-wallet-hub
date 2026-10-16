-- Seed the Control Tower admin (email/password auth).
-- Password is set via extensions.crypt; change it in the Auth dashboard after first login if needed.

do $$
declare
  uid uuid := gen_random_uuid();
  existing uuid;
  pid uuid;
begin
  select id into existing from auth.users where lower(email) = lower('beautywalletke@gmail.com');
  if existing is not null then
    uid := existing;
    update auth.users
    set encrypted_password = crypt('beautywallet', gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now(),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
          || jsonb_build_object('full_name', 'Beauty Wallet Admin'),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'))
    where id = uid;
  else
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000',
      uid,
      'authenticated',
      'authenticated',
      'beautywalletke@gmail.com',
      crypt('beautywallet', gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', 'Beauty Wallet Admin'),
      now(), now(), '', '', '', '', false, false
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      uid,
      jsonb_build_object('sub', uid::text, 'email', 'beautywalletke@gmail.com', 'email_verified', true),
      'email',
      uid::text,
      now(), now(), now()
    );
  end if;

  select id into pid from public.profiles where user_id = uid;
  if pid is null then
    insert into public.profiles (user_id, full_name, email, role, status)
    values (uid, 'Beauty Wallet Admin', 'beautywalletke@gmail.com', 'admin', 'active')
    returning id into pid;
    insert into public.wallets (profile_id) values (pid)
    on conflict (profile_id) do nothing;
  else
    update public.profiles
    set role = 'admin',
        full_name = 'Beauty Wallet Admin',
        email = 'beautywalletke@gmail.com',
        status = 'active'
    where id = pid;
  end if;
end $$;
