-- ============================================================
-- Cover images, round 4. Same rules as before: Wikimedia Commons
-- only, hotlinked via Special:FilePath, verified HTTP 200 + image/*
-- content-type before being added, only fills festivals with no
-- existing cover_image_url.
--
-- Most smaller/regional festivals (US club-culture festivals like
-- CRSSD, Veld, III Points, ARC, Houghton, HARD Summer's specific
-- editions, Lost Lands) simply have no dedicated Commons presence —
-- checked and skipped rather than guessed.
-- ============================================================

update public.festivals f
set cover_image_url = d.url
from (values
  ('monegros', 'https://commons.wikimedia.org/wiki/Special:FilePath/Monegros_Desert_Festival_-_Vista_general.jpg'),
  ('melt', 'https://commons.wikimedia.org/wiki/Special:FilePath/Sunset_at_Melt!_music_festival_in_Ferropolis,_Germany.JPG')
) as d(slug, url)
where f.slug = d.slug
  and f.cover_image_url is null;
