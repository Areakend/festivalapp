-- ============================================================
-- Cover image improvements, round 2.
--
-- 1) Replace 4 images that show an identifiable person's face
--    (a portrait, a band close-up, a DJ, a jumbotron face) with
--    logos or face-free photos — avoids both copyright concerns
--    around press photography of individuals and personality-
--    rights concerns around using someone's likeness in the app.
-- 2) Add covers (official logo where available, else a face-free
--    crowd/stage/venue photo) for festivals that had none.
--
-- Same rules as the first cover_images.sql: Wikimedia Commons only,
-- hotlinked via Special:FilePath (never re-hosted), every URL
-- verified HTTP 200 + image content-type before being added.
-- SVG logos are rasterized via the `?width=` query param, since
-- expo-image cannot render raw SVG.
-- ============================================================

update public.festivals f
set cover_image_url = d.url
from (values
  -- corrections: no more visible faces
  ('tomorrowland', 'https://commons.wikimedia.org/wiki/Special:FilePath/TomorrowLand_-_A_Look_From_The_Sky_(13891384681).jpg'),
  ('sziget', 'https://commons.wikimedia.org/wiki/Special:FilePath/Sziget_logo_2005.jpg'),
  ('primavera-sound', 'https://commons.wikimedia.org/wiki/Special:FilePath/LogoPrimaveraSound.png'),
  ('lollapalooza', 'https://commons.wikimedia.org/wiki/Special:FilePath/Lollapalooza_logo.svg?width=600')
) as d(slug, url)
where f.slug = d.slug;

-- New covers (official logo preferred, else a face-free crowd/stage photo)
-- for festivals that previously had none.
update public.festivals f
set cover_image_url = d.url
from (values
  ('exit', 'https://commons.wikimedia.org/wiki/Special:FilePath/Exit_Official_Logo.png'),
  ('time-warp', 'https://commons.wikimedia.org/wiki/Special:FilePath/Time_Warp_Festival_Logo.png'),
  ('sunburn', 'https://commons.wikimedia.org/wiki/Special:FilePath/Sunburnfestivallogo.jpg'),
  ('untold', 'https://commons.wikimedia.org/wiki/Special:FilePath/Untold_Festival,_main_stage.jpg'),
  ('parookaville', 'https://commons.wikimedia.org/wiki/Special:FilePath/Parookaville_Main_2019.jpg'),
  ('boomtown', 'https://commons.wikimedia.org/wiki/Special:FilePath/Boomtown_Fair_Opening_Ceremony_2019.jpg'),
  ('dgtl', 'https://commons.wikimedia.org/wiki/Special:FilePath/Dgtl_Logo_in_black_circle.png'),
  ('electric-love', 'https://commons.wikimedia.org/wiki/Special:FilePath/Electric_Love_Festival_-_Logo.jpg')
) as d(slug, url)
where f.slug = d.slug
  and f.cover_image_url is null;
