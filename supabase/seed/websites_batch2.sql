-- Official website backfill, batch 2/4 — verified via web search. Two
-- SOCIAL_ONLY cases: Creamfields Hong Kong (no resolving domain, only
-- ticketing-aggregator listings) and S2O Hong Kong (its own domain
-- currently resolves to an unrelated webmail login, not the festival).

update festivals set official_website = v.url
from (values
  ('Woodstoig', 'https://www.woodstoig.de/'),
  ('Holy Ship! Wrecked', 'https://holyship.com/'),
  ('Medusa Festival', 'https://www.medusasunbeach.com/'),
  ('Time Warp Spain', 'https://www.time-warp.de/spain/'),
  ('Brunch Electronik', 'https://brunchelectronikfestival.com/en/'),
  ('Cercle Music Festival', 'https://festival.cercle.io/'),
  ('Chauffer dans la Noirceur', 'https://association.chaufferdanslanoirceur.org/'),
  ('Delta Festival', 'https://delta-festival.com/'),
  ('Dream Nation', 'https://dreamnation.fr/en/'),
  ('Elektric Park', 'https://www.elektricpark.com/'),
  ('Eskape Festival', 'https://www.eskapefestival.com/'),
  ('Les Déferlantes', 'https://www.festival-lesdeferlantes.com/'),
  ('Solidays', 'https://www.solidays.org/'),
  ('AVA Festival', 'https://avafestival.com/'),
  ('FLY Open Air Festival', 'https://www.flyopenair.co.uk/'),
  ('Houghton Festival', 'https://www.houghtonfestival.co.uk/'),
  ('Lost Village', 'https://lostvillagefestival.com/'),
  ('Primer Music Festival', 'https://primermusicfestival.com/'),
  ('Creamfields Hong Kong', 'https://www.instagram.com/creamfieldshk/'),
  ('S2O Hong Kong', 'https://www.instagram.com/s2ohongkong/'),
  ('Defected Croatia', 'https://croatia.defected.com/'),
  ('Dimensions Festival', 'https://dimensionsfestival.com/')
) as v(name, url)
where festivals.name = v.name;
