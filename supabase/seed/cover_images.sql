-- ============================================================
-- Festival cover images — Wikimedia Commons (freely licensed,
-- hotlinked via Special:FilePath, Wikimedia's own stable
-- direct-link mechanism — no images are copied to our storage).
--
-- We intentionally do NOT re-host promotional/press photos in our
-- own Supabase Storage bucket: those belong to the organizers and
-- rehosting them would be a copyright risk. Commons content is
-- explicitly cleared for reuse, so linking to it directly is safe.
--
-- Every URL below was verified to return HTTP 200 with an image/*
-- content-type before being added.
--
-- Only fills festivals that don't already have a cover_image_url.
-- ============================================================

update public.festivals f
set cover_image_url = d.url
from (values
  ('tomorrowland', 'https://commons.wikimedia.org/wiki/Special:FilePath/Solveig_TML2022_Mainstage.jpg'),
  ('ultra-miami', 'https://commons.wikimedia.org/wiki/Special:FilePath/Ultra_Music_Fest_2010.jpg'),
  ('edc-las-vegas', 'https://commons.wikimedia.org/wiki/Special:FilePath/EDC_Mainstage_2018.jpg'),
  ('glastonbury', 'https://commons.wikimedia.org/wiki/Special:FilePath/Glastonbury_Festival_fields_-_geograph.org.uk_-_32812.jpg'),
  ('awakenings', 'https://commons.wikimedia.org/wiki/Special:FilePath/Awakenings,_Gashouder_Amsterdam_(Ank_Kumar)_01.jpg'),
  ('coachella', 'https://commons.wikimedia.org/wiki/Special:FilePath/Energy-Playground-Coachella.jpg'),
  ('sziget', 'https://commons.wikimedia.org/wiki/Special:FilePath/Suzanne_Vega_at_Sziget_Festival,_Budapest,_in_2000.jpg'),
  ('creamfields', 'https://commons.wikimedia.org/wiki/Special:FilePath/Creamfields_Brasil_2013.jpg'),
  ('defqon-1', 'https://commons.wikimedia.org/wiki/Special:FilePath/Defqon.1_2010.jpg'),
  ('primavera-sound', 'https://commons.wikimedia.org/wiki/Special:FilePath/Jens_Lekman_band_Primavera_Sound-2006-06-01.jpg'),
  ('burning-man', 'https://commons.wikimedia.org/wiki/Special:FilePath/Burning_Man_2014_(15128868536).jpg'),
  ('lollapalooza', 'https://commons.wikimedia.org/wiki/Special:FilePath/Lollapalooza_2015.JPG'),
  ('balaton-sound', 'https://commons.wikimedia.org/wiki/Special:FilePath/Balatonsound2009.jpg'),
  ('kappa-futurfestival', 'https://commons.wikimedia.org/wiki/Special:FilePath/Kappa_Futur_Festival_2025_-_Futur_Stage.jpg')
) as d(slug, url)
where f.slug = d.slug
  and f.cover_image_url is null;
