update public.tiers
set perks = array_remove(perks, '10% of unused coins roll over')
where id = 'basic';
