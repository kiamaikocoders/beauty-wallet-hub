-- Team proposal enquiries from the public /teams form.
create table public.teams_enquiries (
  id bigint generated always as identity primary key,
  company_name text not null,
  work_email text not null,
  team_size text not null,
  phone text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.teams_enquiries enable row level security;

create or replace function public.submit_teams_enquiry(
  p_company_name text,
  p_work_email text,
  p_team_size text,
  p_phone text,
  p_notes text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_company text := trim(coalesce(p_company_name, ''));
  v_email text := lower(trim(coalesce(p_work_email, '')));
  v_size text := trim(coalesce(p_team_size, ''));
  v_phone text := trim(coalesce(p_phone, ''));
  v_notes text := nullif(trim(coalesce(p_notes, '')), '');
begin
  if char_length(v_company) < 2 or char_length(v_company) > 200 then
    raise exception 'invalid_company_name';
  end if;
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254 then
    raise exception 'invalid_work_email';
  end if;
  if v_size not in ('1 to 10 people', '11 to 50 people', '51 to 200 people', '200+ people') then
    raise exception 'invalid_team_size';
  end if;
  if char_length(v_phone) < 9 or char_length(v_phone) > 30 then
    raise exception 'invalid_phone';
  end if;
  if v_notes is not null and char_length(v_notes) > 2000 then
    raise exception 'invalid_notes';
  end if;

  insert into public.teams_enquiries (company_name, work_email, team_size, phone, notes)
  values (v_company, v_email, v_size, v_phone, v_notes)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_teams_enquiry(text, text, text, text, text) from public;
grant execute on function public.submit_teams_enquiry(text, text, text, text, text) to anon, authenticated;

revoke all on table public.teams_enquiries from anon, authenticated;
grant select, insert on table public.teams_enquiries to service_role;
