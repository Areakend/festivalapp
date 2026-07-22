-- Official website backfill, batch 3/4 — verified via web search. Vh1
-- Supersonic (India) hasn't run since 2024 and its old domain now redirects
-- to its parent media company post-merger, so its Instagram is used as the
-- most reliable current link.

update festivals set official_website = v.url
from (values
  ('Hideout Festival', 'https://hideoutfestival.com/'),
  ('Love International Festival', 'https://www.loveinternationalfestival.com/'),
  ('Outlook Origins', 'https://www.outlookorigins.com/'),
  ('Sea Star Festival', 'https://seastarfestival.com/'),
  ('Sonus Festival', 'https://www.sonuscroatia.com/'),
  ('Balaton Sound', 'https://balatonsound.com/en/'),
  ('Vh1 Supersonic', 'https://www.instagram.com/vh1supersonic/'),
  ('Decibel Open Air', 'https://www.decibelopenair.com/'),
  ('Nameless Festival', 'https://www.namelessfestival.it/en'),
  ('Ultra Japan', 'https://ultrajapan.com/'),
  ('Ultra Korea', 'https://ultrakorea.com/'),
  ('World DJ Festival', 'https://wdjfest.com/'),
  ('Francofolies Esch-sur-Alzette', 'https://francofolies.lu/'),
  ('Luxembourg Open Air', 'https://www.loa.lu/'),
  ('Oasis Festival', 'https://www.cultivora.com/oasis'),
  ('Glitch Festival', 'https://www.glitchfestival.com/'),
  ('World Club Dome Malta', 'https://worldclubdomemalta.com/'),
  ('SUNSET By NEON', 'https://www.sunsetbyneon.asia/'),
  ('Amsterdam Dance Event', 'https://www.amsterdam-dance-event.nl/'),
  ('Dream Village', 'https://www.dreamvillage.nl/'),
  ('Dreamfields', 'https://www.dreamfields.nl/'),
  ('Into the Woods Festival', 'https://intothewoods.nl/')
) as v(name, url)
where festivals.name = v.name;
