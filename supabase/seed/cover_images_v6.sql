-- ============================================================
-- Cover images, round 6. Face-avoidance rule relaxed per explicit
-- product decision: a real Commons photo showing identifiable people
-- (crowd, performer) is fine now, not just landscape/logo shots —
-- only re-hosted press-kit photos remain off-limits (licensing, not
-- content). Same verification standard as before: HTTP 200 + image/*
-- confirmed for each URL, only fills currently-null cover_image_url.
-- ============================================================

update public.festivals f
set cover_image_url = d.url
from (values
  ('world-club-dome', 'https://commons.wikimedia.org/wiki/Special:FilePath/World_Club_Dome_2013.jpg'),
  ('bonnaroo', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bonnaroo_arch.jpg'),
  ('solidays', 'https://commons.wikimedia.org/wiki/Special:FilePath/Solidays_Gridshell,_Paris,_France,_2011.jpg'),
  ('delta-festival', 'https://commons.wikimedia.org/wiki/Special:FilePath/Espace_vip_delta_festival.jpg')
) as d(slug, url)
where f.slug = d.slug
  and f.cover_image_url is null;
