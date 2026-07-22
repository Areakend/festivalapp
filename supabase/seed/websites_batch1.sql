-- Official website backfill, batch 1/4 — verified via web search, each URL
-- checked to actually load and show genuine festival content before being
-- reported. Two non-standard cases flagged, included anyway as the closest
-- official presence: Electric Mountain Festival (Austria) has no domain of
-- its own, runs on the Sölden tourism board's site; Vision & Colour (China)
-- has no resolving domain, Instagram is its only official presence.

update festivals set official_website = v.url
from (values
  ('UNTOLD Dubai', 'https://untold.ae/'),
  ('Ultra Buenos Aires', 'https://ultrabuenosaires.com/'),
  ('Electric Mountain Festival', 'https://www.soelden.com/en/events-leisure-tips/events/electric-mountain-festival'),
  ('Rave on Snow', 'https://raveonsnow.com/'),
  ('Beyond The Valley', 'https://beyondthevalley.com.au/'),
  ('Pitch Music & Arts', 'https://www.pitchfestival.com.au/'),
  ('Ultra Australia', 'https://ultraaustralia.com/'),
  ('Fcknye Festival', 'https://www.fcknyefestival.com/'),
  ('Ostend Beach Festival', 'https://www.ostendbeach.be/'),
  ('The Magic Of Tomorrowland', 'https://magicoftomorrowland.com/'),
  ('Veld Music Festival', 'https://veldmusicfestival.com/'),
  ('Creamfields Chile', 'https://creamfields.cl/'),
  ('EDC China', 'https://china.edc.com/'),
  ('Vision & Colour Music Festival', 'https://www.instagram.com/vacfestival/'),
  ('BAUM Festival', 'https://www.baumfestival.com/'),
  ('BEONIX Festival', 'https://beonix.art/'),
  ('Beats For Love', 'https://b4l.cz/'),
  ('Echelon Festival', 'https://www.echelon-festival.de/'),
  ('Lollapalooza Berlin', 'https://www.lollapaloozade.com/'),
  ('MELT Festival', 'https://meltfestival.de/'),
  ('Nibirii Festival', 'https://nibirii.com/'),
  ('Toxicator', 'https://www.toxicator.de/')
) as v(name, url)
where festivals.name = v.name;
