-- ============================================================
-- Festivals discovered in a user's personal "Festival Calendar"
-- archive (monthly picks, Sept 2024 - Oct 2026), not covered by
-- the DJ Mag Top 100 nor the earlier personal-review batch.
--
-- Regional franchise editions (Lollapalooza Berlin, Time Warp
-- Spain, World Club Dome Malta) are separate rows, matching how
-- Ultra Korea / Ultra Japan / EDC Mexico etc. are already modeled.
-- ============================================================

insert into public.festivals (name, slug, description, country, city, genres)
values
  ('Dream Nation', 'dream-nation', 'An electronic music festival in the Paris region.', 'FR', 'Paris', '{edm}'),
  ('Into the Woods Festival', 'into-the-woods', 'A boutique electronic music festival in the Netherlands.', 'NL', null, '{electronic}'),
  ('Elektric Park', 'elektric-park', 'An electronic music festival in the Paris region.', 'FR', 'Paris', '{electronic}'),
  ('Brunch Electronik', 'brunch-electronik', 'A long-running Parisian house/techno day-party festival brand.', 'FR', 'Paris', '{house,techno}'),
  ('Toxicator', 'toxicator', 'A hardcore/hardstyle festival in Mannheim.', 'DE', 'Mannheim', '{hardcore,hardstyle}'),
  ('Transmission', 'transmission', 'A large-scale trance festival, with an edition in Arnhem.', 'NL', 'Arnhem', '{trance}'),
  ('Valhalla', 'valhalla', 'A hardstyle/hardcore event in Amsterdam.', 'NL', 'Amsterdam', '{hardstyle,hardcore}'),
  ('Rave on Snow', 'rave-on-snow', 'An electronic music festival on the ski slopes of Saalbach.', 'AT', 'Saalbach', '{edm}'),
  ('Electric Mountain Festival', 'electric-mountain-festival', 'An electronic music festival in the Austrian Alps.', 'AT', 'Sölden', '{edm}'),
  ('Cercle Music Festival', 'cercle-music-festival', 'The festival edition of the Cercle livestream DJ set brand.', 'FR', 'Le Bourget', '{electronic}'),
  ('Solidays', 'solidays', 'A well-known French charity festival at the Hippodrome de Longchamp, mixing pop, rock and electronic acts.', 'FR', 'Paris', '{pop,rock,electronic}'),
  ('RFM Somnii', 'rfm-somnii', 'An electronic music festival in Portugal, sponsored by radio station RFM.', 'PT', null, '{edm}'),
  ('Dreamfields', 'dreamfields', 'A Dutch electronic music festival.', 'NL', null, '{edm,trance}'),
  ('Ostend Beach Festival', 'ostend-beach-festival', 'A beachside house/EDM festival in Ostend.', 'BE', 'Ostend', '{house,edm}'),
  ('Les Déferlantes', 'les-deferlantes', 'One of the biggest contemporary music festivals in the south of France, at the Jardins du Lydia on the Mediterranean coast. Formerly branded EMF.', 'FR', 'Le Barcarès', '{pop,rock,electro,rap}'),
  ('Echelon Festival', 'echelon-festival', 'An electronic music festival in Germany.', 'DE', null, '{electronic}'),
  ('Delta Festival', 'delta-festival', 'An electronic music festival in Marseille.', 'FR', 'Marseille', '{electronic}'),
  ('Dream Village', 'dream-village', 'A Dutch hardstyle-scene festival.', 'NL', null, '{hardstyle}'),
  ('Amsterdam Dance Event', 'amsterdam-dance-event', 'A week-long, city-wide electronic music conference and club-night event across Amsterdam venues (includes AMF).', 'NL', 'Amsterdam', '{electronic}'),
  ('Lollapalooza Berlin', 'lollapalooza-berlin', 'The Berlin edition of the Lollapalooza festival brand.', 'DE', 'Berlin', '{rock,pop,hiphop,electronic}'),
  ('Time Warp Spain', 'time-warp-spain', 'The Madrid edition of the Time Warp techno festival brand.', 'ES', 'Madrid', '{techno}'),
  ('World Club Dome Malta', 'world-club-dome-malta', 'The Malta ("Island") edition of the World Club Dome festival brand.', 'MT', null, '{edm,house}'),
  ('Woodstoig', 'woodstoig', 'A German electronic music festival celebrating "Love, Peace & Harmonie", running since the mid-2010s. Multiple stages spanning techno, house, drum and bass and hard techno.', 'DE', null, '{techno,house,dnb,hard techno}')
on conflict (slug) do nothing;
