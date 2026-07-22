-- Official website backfill, batch 4/4 — verified via web search + live
-- DNS/browser checks. Also fixes a genuine data error found along the way:
-- Scream Or Dance was recorded as country=NL with no city/genres/
-- description, but it's actually held in Jakarta, Indonesia.
--
-- SAGA Festival and UNSEEN Festival: no working dedicated domain found,
-- Facebook page used as the only current official presence.

update festivals set official_website = v.url
from (values
  ('Scream Or Dance', 'https://screamordance.com'),
  ('Transmission', 'https://transmissionfestival.com'),
  ('Valhalla', 'https://ea-events.com/concept/valhalla/'),
  ('Verknipt Festival', 'https://www.verknipt.org'),
  ('RFM Somnii', 'https://www.rfmsomnii.com'),
  ('Sónar Lisboa', 'https://sonarlisboa.pt'),
  ('SAGA Festival', 'https://www.facebook.com/sagafestivalofficial/'),
  ('Lovefest', 'https://lovefest.rs'),
  ('808 Festival', 'https://808festival.net'),
  ('NEON Countdown', 'https://neoncountdown.asia'),
  ('SIAM Songkran Music Festival', 'https://siamsongkran.info'),
  ('Together Festival', 'https://togetherfestival.net'),
  ('UNSEEN Festival', 'https://www.facebook.com/unseenfestival.th/'),
  ('White Party Bangkok', 'https://whitepartybangkok.com'),
  ('S2O Taiwan', 'https://s2otaiwan.com'),
  ('Ultra Taiwan', 'https://ultrataiwan.com'),
  ('Beyond Wonderland', 'https://www.beyondwonderland.com'),
  ('Groove Cruise', 'https://www.groovecruise.com'),
  ('HARD Summer', 'https://www.hardsummer.com'),
  ('III Points', 'https://www.iiipoints.com'),
  ('Ravolution Music Festival', 'https://www.ravolution.asia'),
  ('Ultra South Africa', 'https://ultrasouthafrica.com')
) as v(name, url)
where festivals.name = v.name;

-- Data-error fix: Scream Or Dance is in Jakarta, Indonesia, not the
-- Netherlands (was recorded with country=NL and no city/genres/description).
update festivals
set country = 'ID',
    city = 'Jakarta',
    genres = array['electronic','pop','hardstyle'],
    description = 'An annual Halloween-themed electronic music festival blending DJ performances with immersive horror installations and Indonesian cultural elements.'
where name = 'Scream Or Dance';
