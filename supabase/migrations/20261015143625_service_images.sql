alter table public.services
  add column image_url text,
  add column popular_rank smallint;

alter table public.providers
  add column photo_url text;

update public.services s set image_url = v.image_url, popular_rank = v.popular_rank
from (values
  ('Skin Fade & Line-up', 'kinyozi-republic', '/images/services/skin-fade-line-up.jpg', 1),
  ('Knotless Braids, Medium', 'braid-bar-ngong-rd', '/images/services/knotless-braids-medium.jpg', 2),
  ('Signature Hydra Facial', 'the-karen-retreat', '/images/services/signature-hydra-facial.jpg', 3),
  ('Gel Manicure', 'polished-kilimani', '/images/services/gel-manicure.jpg', 4)
) as v(name, provider_slug, image_url, popular_rank)
join public.providers p on p.slug = v.provider_slug
where s.provider_id = p.id and s.name = v.name;
