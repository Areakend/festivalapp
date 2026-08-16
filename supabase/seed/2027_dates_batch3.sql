-- ============================================================
-- 2027 dates for festivals whose 2026 edition finished in the last
-- ~6 weeks (researched 2026-08-16), continuing the ongoing "keep
-- recently-finished festivals from going stale" pass. Only
-- officially-confirmed dates were added (festival's own site/
-- ticketing partner, or a named outlet citing an official
-- announcement) -- most festivals don't announce next year's dates
-- until months after wrapping, so a lot of "not yet announced" was
-- expected and is not included here.
--
-- Checked but not added, with why:
--   sziget, lovefest, echelon-festival, boots-and-hearts, houghton,
--   outside-lands, brunch-electronik, baalbeck-international-festival,
--   waterbomb-busan, hard-summer, woodstoig, eskape,
--   world-club-dome-malta, dekmantel, lollapalooza, outlook-origins,
--   tomorrowland, delta-festival
--     -- 2027 not officially announced yet (several -- outside-lands,
--     delta-festival -- have a confirmed return but no exact dates
--     yet; tomorrowland (Boom, BE)'s 2027 dates specifically are not
--     out yet even though Tomorrowland Winter and Tomorrowland
--     Brasil 2027 already are, those are separate tracked festivals)
--
--   defected-croatia -- CONFIRMED DISCONTINUED at its Tisno venue:
--     Defected's CEO stated the Jul 29-Aug 3, 2026 edition was the
--     final one at The Garden Resort. A "new offering" for 2027 was
--     teased with no location or dates announced, so nothing to add.
-- ============================================================

-- 11 rows
insert into public.festival_editions (festival_id, year, start_date, end_date)
select f.id, v.year, v.start_date::date, v.end_date::date
from (values
  ('baja-beach-fest', 2027, '2027-08-06', '2027-08-08'),
  ('bloodstock-open-air', 2027, '2027-08-05', '2027-08-08'),
  ('glitch', 2027, '2027-08-11', '2027-08-14'),
  ('loveland', 2027, '2027-08-07', '2027-08-08'),
  ('nature-one', 2027, '2027-07-29', '2027-08-01'),
  ('neopop', 2027, '2027-08-05', '2027-08-07'),
  ('osheaga', 2027, '2027-07-30', '2027-08-01'),
  ('summer-breeze-open-air', 2027, '2027-08-18', '2027-08-21'),
  ('untold', 2027, '2027-08-05', '2027-08-08'),
  ('veld', 2027, '2027-07-30', '2027-08-01'),
  ('way-out-west', 2027, '2027-08-12', '2027-08-14')
) as v(slug, year, start_date, end_date)
join public.festivals f on f.slug = v.slug
on conflict (festival_id, year) do update
  set start_date = excluded.start_date, end_date = excluded.end_date;
