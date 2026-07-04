-- ============================================================
-- Cover image improvements, round 3.
--
-- 1) Fix Time Warp: its only logo on Commons is black text on a
--    transparent background, which is nearly invisible against the
--    app's dark cover background — replaced with a face-free crowd
--    photo. (Caught by compositing every candidate over the app's
--    #1F1F32 cover background before using it, going forward.)
-- 2) Add covers for more festivals: official logo where available
--    and legible on a dark background, else a face-free crowd/stage
--    photo. All 7 Ultra regional editions share the brand's global
--    logo (there's no separate Commons logo per region).
--
-- Same rules as before: Wikimedia Commons only, hotlinked via
-- Special:FilePath, every URL verified HTTP 200 + correct content
-- type, every photo visually inspected for identifiable faces.
-- ============================================================

-- correction: Time Warp's logo is unreadable on a dark background
update public.festivals
set cover_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/TDK_Time_Warp_2006.jpg'
where slug = 'time-warp';

update public.festivals f
set cover_image_url = d.url
from (values
  ('ultra-europe', 'https://commons.wikimedia.org/wiki/Special:FilePath/UMF_Logo_White.png'),
  ('ultra-japan', 'https://commons.wikimedia.org/wiki/Special:FilePath/UMF_Logo_White.png'),
  ('ultra-korea', 'https://commons.wikimedia.org/wiki/Special:FilePath/UMF_Logo_White.png'),
  ('ultra-australia', 'https://commons.wikimedia.org/wiki/Special:FilePath/UMF_Logo_White.png'),
  ('ultra-south-africa', 'https://commons.wikimedia.org/wiki/Special:FilePath/UMF_Logo_White.png'),
  ('ultra-taiwan', 'https://commons.wikimedia.org/wiki/Special:FilePath/UMF_Logo_White.png'),
  ('ultra-buenos-aires', 'https://commons.wikimedia.org/wiki/Special:FilePath/UMF_Logo_White.png'),
  ('mysteryland', 'https://commons.wikimedia.org/wiki/Special:FilePath/Mysteryland_logo.png'),
  ('time-warp-spain', 'https://commons.wikimedia.org/wiki/Special:FilePath/TDK_Time_Warp_2006.jpg'),
  ('nature-one', 'https://commons.wikimedia.org/wiki/Special:FilePath/German_Nature_One_2018_Classic_Terminal.jpg'),
  ('snowbombing', 'https://commons.wikimedia.org/wiki/Special:FilePath/Snowbombing_Street_Party.jpg'),
  ('electric-castle', 'https://commons.wikimedia.org/wiki/Special:FilePath/Electric_Castle_Festival_Logo.jpg'),
  ('lollapalooza-berlin', 'https://commons.wikimedia.org/wiki/Special:FilePath/Lollapalooza_logo.svg?width=600'),
  ('rock-werchter', 'https://commons.wikimedia.org/wiki/Special:FilePath/Plaine_de_Werchter.jpg')
) as d(slug, url)
where f.slug = d.slug
  and f.cover_image_url is null;
