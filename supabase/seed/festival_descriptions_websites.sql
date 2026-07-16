-- ============================================================
-- Description + official_website fill for 31 festivals that
-- had neither. Idempotent/non-destructive: only fills fields
-- that are currently null (existing values are preserved).
-- Scream Or Dance is deliberately skipped, same as the earlier
-- city/genres pass — no reliable source found for it.
-- ============================================================

update public.festivals f
set description = coalesce(f.description, v.description),
    official_website = coalesce(f.official_website, v.website)
from (values
  ('panorama', 'An electronic music festival held in the ancient Cave del Duca amphitheatre in Lecce, Puglia, founded in 2022 and focused on house and techno.', 'https://www.panorama-festival.it/en/'),
  ('positiv', 'A techno and house festival staged in the Roman Théâtre Antique d''Orange, running since 2017.', 'https://positivfestival.fr/en/'),
  ('together', 'An electronic music festival in Bangkok.', null),
  ('ravolution', 'Vietnam''s leading international EDM festival, running multiple themed ''chapters'' per year in Ho Chi Minh City.', null),
  ('blacklist', 'A raw, industrial-themed techno and hard techno festival held at the Turbinenhalle in Oberhausen.', 'https://blacklist-festival.com/'),
  ('lmf', 'An electronic music festival held on the shores of Lake Jarun in Zagreb.', 'https://www.lmffestival.com/'),
  ('vision-colour', 'A large-scale electronic and EDM festival touring Chinese cities, currently based in Zhuhai.', null),
  ('ultra-taiwan', 'The Taiwanese edition of the global Ultra Music Festival brand, held in Taipei.', null),
  ('white-party-bangkok', 'An annual New Year''s circuit dance party and festival in Bangkok, part of the global White Party series.', null),
  ('s2o-hong-kong', 'The Hong Kong edition of S2O Songkran Music Festival, combining a water-fight party atmosphere with EDM.', null),
  ('sunset-by-neon', 'An electronic music festival in Kuala Lumpur.', null),
  ('edc-china', 'The Chinese edition of Insomniac''s Electric Daisy Carnival, held in Suzhou.', null),
  ('edc-thailand', 'The Thai edition of Insomniac''s Electric Daisy Carnival, held at Rhythm Park in Phuket.', 'https://thailand.edc.com/'),
  ('holy-ship-wrecked', 'A beach-festival edition of the Holy Ship! cruise festival brand, focused on house and techno.', null),
  ('ultra-buenos-aires', 'The Argentine edition of Ultra Music Festival, held in Buenos Aires.', null),
  ('unseen', 'An electronic music festival in Bangkok.', null),
  ('ultra-australia', 'The Australian edition of Ultra Music Festival, held in Melbourne.', null),
  ('gmo-sonic', 'A large-scale EDM festival in Japan featuring major international headliners, held at venues like Chiba''s Makuhari Messe.', 'https://sonic.gmo/en/'),
  ('defected-malta', 'The Maltese edition of Defected Records'' house music festival brand.', 'https://malta.defected.com/'),
  ('magic-of-tomorrowland', 'A Tomorrowland-branded live event experience held in Boom, Belgium.', null),
  ('creamfields-hong-kong', 'The Hong Kong edition of the UK''s Creamfields dance music festival brand.', null),
  ('ultra-south-africa', 'The South African edition of Ultra Music Festival, held in Johannesburg.', null),
  ('chauffer-dans-la-noirceur', 'An eco-conscious beach festival on the Normandy coast at Montmartin-sur-Mer, running for over 30 editions.', null),
  ('dour-festival', 'One of Belgium''s largest alternative music festivals, running since 1989, spanning electronic, hip-hop and rock across dozens of stages.', 'https://dourfestival.eu/'),
  ('eskape', 'A hardstyle, hardcore and rawstyle festival in Normandy, France.', null),
  ('beauregard', 'A multi-genre pop, rock and electronic festival held in the grounds of the Château de Beauregard in Normandy.', 'https://www.festivalbeauregard.com/'),
  ('francofolies-la-rochelle', 'The original Francofolies festival, founded in 1985, celebrating French-language song across genres.', 'https://www.francofolies.fr/'),
  ('hellfest', 'One of Europe''s largest metal and hard rock festivals, running since 2006 in Clisson.', 'https://www.hellfest.fr/'),
  ('les-ardentes', 'Belgium''s leading hip-hop and urban music festival, running since 2005 in Liège.', 'https://www.lesardentes.be/'),
  ('les-vieilles-charrues', 'One of France''s largest music festivals, running since 1992 in Brittany, spanning rock, pop and chanson.', 'https://www.vieillescharrues.asso.fr/'),
  ('thuishaven', 'An Amsterdam house and electronic music venue known for its seasonal outdoor festival events.', 'https://www.thuishaven.nl/')
) as v(slug, description, website)
where f.slug = v.slug;
