update public.services s set image_url = v.image_url
from (values
  ('Soft Glam Makeup', 'glow-studio-lavington', '/images/services/soft-glam-makeup.jpg'),
  ('Hot Towel Beard Sculpt', 'the-gentlemens-chair', '/images/services/hot-towel-beard-sculpt.jpg'),
  ('Hot Stone Massage', 'the-karen-retreat', '/images/services/hot-stone-massage.jpg'),
  ('Loc Retwist & Style', 'roots-natural-studio', '/images/services/loc-retwist-style.jpg'),
  ('Express Glow Facial', 'the-karen-retreat', '/images/services/express-glow-facial.jpg')
) as v(name, provider_slug, image_url)
join public.providers p on p.slug = v.provider_slug
where s.provider_id = p.id and s.name = v.name and (s.image_url is null or s.image_url = '');

update public.providers
set cover_url = '/images/provider/karen-cover.jpg'
where slug = 'the-karen-retreat' and (cover_url is null or cover_url = '');
