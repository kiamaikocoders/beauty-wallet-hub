create or replace function public.admin_map_points()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not admin' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'providers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'area', p.area,
        'kind', p.kind,
        'status', p.status,
        'lat', p.location_lat,
        'lng', p.location_lng,
        'address', p.address_text
      ) order by p.name)
      from public.providers p
      where p.location_lat is not null and p.location_lng is not null
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'area', coalesce(pr.area, 'Nairobi'),
        'lat', pr.location_lat,
        'lng', pr.location_lng
      ))
      from public.profiles pr
      where pr.role = 'member'
        and pr.location_lat is not null
        and pr.location_lng is not null
    ), '[]'::jsonb),
    'neighbourhoods', coalesce((
      select jsonb_agg(jsonb_build_object('area', n.area, 'members', n.members) order by n.members desc)
      from (
        select coalesce(pr.area, 'Nairobi') as area, count(*)::int as members
        from public.profiles pr
        where pr.role = 'member' and pr.location_lat is not null
        group by 1
      ) n
    ), '[]'::jsonb),
    'missingPins', (
      select count(*)::int from public.providers p where p.location_lat is null
    )
  );
end;
$$;

revoke all on function public.admin_map_points() from public;
grant execute on function public.admin_map_points() to authenticated;
