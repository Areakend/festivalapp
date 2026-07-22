-- 22 new festivals added to the catalog, researched for genre/geographic
-- diversity beyond the existing electronic/dance-heavy roster (rock, metal,
-- hip-hop, jazz, world music added). 3 of the original 25 candidates were
-- dropped as undetected duplicates of existing entries: "Bonnaroo" (=
-- Bonnaroo Music & Arts Festival), "Dekmantel Festival" (exact existing
-- name), "Exit Festival" (= EXIT Festival) — cross-checked against the live
-- table rather than trusting the research agent's own dedup.
--
-- No cover images yet (out of scope for this pass) — cover_image_url left
-- null, same treatment as any festival awaiting a Commons photo or
-- generated cover.

insert into festivals (name, slug, description, country, city, genres, official_website)
values
  ('Roskilde Festival', 'roskilde-festival',
   'Northern Europe''s largest nonprofit music festival, an eight-day event mixing major headliners with emerging acts and activist culture.',
   'DK', 'Roskilde', array['rock','indie','electronic','hip-hop'], 'https://www.roskilde-festival.dk/en'),

  ('Fuji Rock Festival', 'fuji-rock-festival',
   'Japan''s largest outdoor music festival, staged at the Naeba Ski Resort surrounded by mountains and forest.',
   'JP', 'Yuzawa (Naeba)', array['rock','indie','electronic'], 'https://www.fujirockfestival.com/'),

  ('Rock in Rio', 'rock-in-rio',
   'One of the world''s biggest music festivals, founded in Rio in 1985 and now also held in Lisbon and Las Vegas.',
   'BR', 'Rio de Janeiro', array['rock','pop','latin'], 'https://rockinrio.com/rio/en/'),

  ('Electric Forest', 'electric-forest',
   'An immersive electronic and jam-band festival set in an illuminated forest at Double JJ Ranch, Michigan.',
   'US', 'Rothbury, MI', array['electronic','jam','bass'], 'https://electricforestfestival.com/'),

  ('Rolling Loud', 'rolling-loud',
   'The world''s largest touring hip-hop festival brand, founded in Miami and now staged across multiple countries.',
   'US', 'Orlando, FL', array['hip-hop','rap'], 'https://www.rollingloud.com/'),

  ('Download Festival', 'download-festival',
   'The UK''s premier rock and metal festival, held at the Donington Park motor racing circuit since 2003.',
   'GB', 'Castle Donington', array['rock','metal','hard rock'], 'https://downloadfestival.co.uk/'),

  ('Graspop Metal Meeting', 'graspop-metal-meeting',
   'One of Europe''s largest heavy metal festivals, held annually at Festivalpark Stenehei.',
   'BE', 'Dessel', array['metal','hard rock'], 'https://www.graspop.be/en'),

  ('Lowlands', 'lowlands',
   'A hugely popular Dutch multi-genre festival known for its broad, adventurous lineup.',
   'NL', 'Biddinghuizen', array['rock','indie','electronic','hip-hop'], 'https://lowlands.nl/en'),

  ('Electric Picnic', 'electric-picnic',
   'Ireland''s leading music and arts festival, held at Stradbally Hall with a strong arts/comedy program.',
   'IE', 'Stradbally', array['rock','indie','electronic','pop'], 'https://www.electricpicnic.ie/'),

  ('Mad Cool Festival', 'mad-cool-festival',
   'A fast-growing Madrid festival pairing major international rock/pop headliners with an alternative lineup.',
   'ES', 'Madrid', array['rock','indie','pop','alternative'], 'https://madcoolfestival.es/'),

  ('Bilbao BBK Live', 'bilbao-bbk-live',
   'A scenic Basque Country festival on Mount Kobetamendi overlooking Bilbao.',
   'ES', 'Bilbao', array['rock','indie','electronic'], 'https://bilbaobbklive.com/en/'),

  ('WOMAD', 'womad',
   'A pioneering world-music festival co-founded by Peter Gabriel, showcasing global artists, dance, and crafts.',
   'GB', 'Corsham (Neston Park)', array['world music','folk'], 'https://womad.co.uk/'),

  ('Montreux Jazz Festival', 'montreux-jazz-festival',
   'A world-renowned lakeside jazz festival that has expanded to host rock, pop, and electronic artists since 1967.',
   'CH', 'Montreux', array['jazz','blues','world'], 'https://www.montreuxjazzfestival.com/en/'),

  ('New Orleans Jazz Fest', 'new-orleans-jazz-fest',
   'A celebration of Louisiana''s musical heritage at the Fair Grounds Race Course, spanning jazz, blues, and gospel.',
   'US', 'New Orleans, LA', array['jazz','blues','funk','gospel'], 'https://www.nojazzfest.com/'),

  ('Clockenflap', 'clockenflap',
   'Hong Kong''s biggest outdoor music and arts festival, staged on the Central Harbourfront.',
   'HK', 'Hong Kong', array['indie','rock','electronic','hip-hop'], 'https://www.clockenflap.com/'),

  ('Splendour in the Grass', 'splendour-in-the-grass',
   'Australia''s flagship winter festival at North Byron Parklands, returning in 2026 after a two-year hiatus.',
   'AU', 'Byron Bay', array['rock','indie','pop','electronic'], 'https://splendourinthegrass.com/'),

  ('Open''er Festival', 'opener-festival',
   'Poland''s largest music festival, held on a former airport by the Baltic coast.',
   'PL', 'Gdynia', array['rock','indie','electronic','hip-hop'], 'https://opener.pl/en'),

  ('Colours of Ostrava', 'colours-of-ostrava',
   'A multi-genre international festival in the striking industrial grounds of the former Dolní Vítkovice ironworks.',
   'CZ', 'Ostrava', array['world','rock','pop','alternative'], 'https://www.colours.cz/en/'),

  ('Vive Latino', 'vive-latino',
   'Latin America''s premier rock festival at Estadio GNP Seguros, showcasing Ibero-American and international acts.',
   'MX', 'Mexico City', array['rock','latin','alternative'], 'https://www.vivelatino.com/'),

  ('Wireless Festival', 'wireless-festival',
   'The UK''s leading hip-hop and R&B festival held annually in Finsbury Park.',
   'GB', 'London', array['hip-hop','rap','r&b','grime'], 'https://www.wirelessfestival.co.uk/'),

  ('Way Out West', 'way-out-west',
   'A vegetarian-food, film, and music festival in Gothenburg''s Slottsskogen park.',
   'SE', 'Gothenburg', array['indie','electronic','rock','hip-hop'], 'https://www.wayoutwest.se/'),

  ('Summer Breeze Open Air', 'summer-breeze-open-air',
   'A major European metal festival on a former Bavarian airfield covering the full spectrum of metal subgenres.',
   'DE', 'Dinkelsbühl', array['metal','heavy metal','death metal'], 'https://www.summer-breeze.de/en/')
on conflict (slug) do nothing;

insert into festival_editions (festival_id, year, start_date, end_date)
select f.id, v.year, v.start_date::date, v.end_date::date
from (values
  ('roskilde-festival', 2026, '2026-06-27', '2026-07-04'),
  ('fuji-rock-festival', 2026, '2026-07-24', '2026-07-26'),
  ('rock-in-rio', 2026, '2026-09-04', '2026-09-13'),
  ('electric-forest', 2026, '2026-06-25', '2026-06-28'),
  ('rolling-loud', 2026, '2026-05-08', '2026-05-10'),
  ('download-festival', 2026, '2026-06-10', '2026-06-14'),
  ('graspop-metal-meeting', 2026, '2026-06-18', '2026-06-21'),
  ('lowlands', 2026, '2026-08-21', '2026-08-23'),
  ('electric-picnic', 2026, '2026-08-28', '2026-08-30'),
  ('mad-cool-festival', 2026, '2026-07-08', '2026-07-11'),
  ('bilbao-bbk-live', 2026, '2026-07-09', '2026-07-11'),
  ('womad', 2026, '2026-07-23', '2026-07-26'),
  ('montreux-jazz-festival', 2026, '2026-07-03', '2026-07-18'),
  ('new-orleans-jazz-fest', 2026, '2026-04-23', '2026-05-03'),
  ('clockenflap', 2025, '2025-12-05', '2025-12-07'),
  ('splendour-in-the-grass', 2026, '2026-07-17', '2026-07-19'),
  ('opener-festival', 2026, '2026-07-01', '2026-07-04'),
  ('colours-of-ostrava', 2026, '2026-07-15', '2026-07-18'),
  ('vive-latino', 2026, '2026-03-14', '2026-03-15'),
  ('wireless-festival', 2025, '2025-07-11', '2025-07-13'),
  ('way-out-west', 2026, '2026-08-13', '2026-08-15'),
  ('summer-breeze-open-air', 2026, '2026-08-12', '2026-08-15')
) as v(slug, year, start_date, end_date)
join festivals f on f.slug = v.slug
on conflict (festival_id, year) do nothing;
