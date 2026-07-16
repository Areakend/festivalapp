-- ============================================================
-- Metadata fill: city + genres for festivals that had neither.
-- Sourced from official sites, Wikipedia, press coverage.
-- Scream Or Dance is deliberately skipped (see festival-data audit
-- comments elsewhere): no reliable source could be found for it.
-- ============================================================

update public.festivals set city = v.city
from (values
  ('blacklist', 'Oberhausen'),
  ('defected-malta', 'Attard'),
  ('dream-village', 'Bavel'),
  ('dreamfields', 'Lathum'),
  ('echelon-festival', 'Bad Aibling'),
  ('edc-china', 'Suzhou'),
  ('edc-thailand', 'Phuket'),
  ('beauregard', 'Hérouville-Saint-Clair'),
  ('gmo-sonic', 'Chiba'),
  ('hellfest', 'Clisson'),
  ('into-the-woods', 'Amersfoort'),
  ('les-ardentes', 'Liège'),
  ('lmf', 'Zagreb'),
  ('panorama', 'Lecce'),
  ('positiv', 'Orange'),
  ('ravolution', 'Ho Chi Minh City'),
  ('rfm-somnii', 'Figueira da Foz'),
  ('magic-of-tomorrowland', 'Boom'),
  ('unseen', 'Bangkok'),
  ('vision-colour', 'Zhuhai'),
  ('woodstoig', 'Riedhausen'),
  ('world-club-dome-malta', 'Rabat')
) as v(slug, city)
where festivals.slug = v.slug;

update public.festivals set genres = v.genres
from (values
  ('blacklist', array['techno','hard techno']::text[]),
  ('chauffer-dans-la-noirceur', array['electro','techno']::text[]),
  ('dour-festival', array['electro','techno','hip-hop','bass']::text[]),
  ('edc-china', array['edm','house','trance','dubstep']::text[]),
  ('eskape', array['hardstyle','hardcore','rawstyle']::text[]),
  ('beauregard', array['pop','rock','electro']::text[]),
  ('francofolies-la-rochelle', array['chanson','pop','rock']::text[]),
  ('hellfest', array['metal','rock']::text[]),
  ('holy-ship-wrecked', array['edm','house','dance']::text[]),
  ('les-ardentes', array['hip-hop','rap','urban']::text[]),
  ('les-vieilles-charrues', array['rock','pop','chanson']::text[]),
  ('lmf', array['electronic','house']::text[]),
  ('positiv', array['techno','house','electro']::text[]),
  ('ravolution', array['edm','dance']::text[]),
  ('magic-of-tomorrowland', array['edm','dance','trance']::text[]),
  ('thuishaven', array['house','electronic']::text[]),
  ('unseen', array['edm','house']::text[])
) as v(slug, genres)
where festivals.slug = v.slug;
