-- ============================================================
-- Cover images, round 5. Same rules as before: Wikimedia Commons
-- only, hotlinked via Special:FilePath, verified HTTP 200 + image/*
-- content-type before being added, only fills festivals with no
-- existing cover_image_url.
--
-- Hellfest and Les Ardentes were checked but skipped: their Commons
-- categories are dominated by named-performer close-ups (face-avoidance
-- rule from cover_images_v2), and no clearly face-free general/crowd
-- shot could be confirmed without visual inspection.
-- ============================================================

update public.festivals f
set cover_image_url = d.url
from (values
  ('les-vieilles-charrues', 'https://commons.wikimedia.org/wiki/Special:FilePath/Festival_des_Vieilles_Charrues_2017_-_drapeau.jpg'),
  ('dour-festival', 'https://commons.wikimedia.org/wiki/Special:FilePath/Dour_festival_2012_dans_la_boue.JPG')
) as d(slug, url)
where f.slug = d.slug
  and f.cover_image_url is null;
