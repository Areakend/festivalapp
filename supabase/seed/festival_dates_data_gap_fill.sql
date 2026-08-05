-- ============================================================
-- Major date-gap fill, researched 2026-08-05.
--
-- A full local rebuild of the schema + every prior seed file (applied
-- migrations then seeds against a local Postgres instance) surfaced
-- that 101 festivals in the catalog had ZERO festival_editions rows —
-- including Tomorrowland, Untold, Creamfields, EXIT, Lollapalooza,
-- Burning Man, Bonnaroo and Sziget. Root cause: the original
-- seed.sql bootstrap's two multi-row INSERTs for those exact 12
-- festivals (Tomorrowland, Ultra Miami, EDC Vegas, Awakenings,
-- Creamfields, Untold, Sziget, Coachella, Mysteryland, EXIT,
-- Parookaville, Defqon.1) are each a single atomic statement — once
-- any one row in the batch conflicted with data already seeded
-- elsewhere (e.g. via the DJ Mag Top 100 batch), the WHOLE statement
-- rolled back, silently dropping dates for every festival in it that
-- wasn't covered by another file. A further 31 festivals had only
-- past editions on file with nothing newer added since.
--
-- 90+ festivals were researched (parallel passes covering all of the
-- above). Only officially-confirmed dates were added — the festival's
-- own site/socials, or a named outlet explicitly citing an official
-- announcement — nothing extrapolated from "usually happens around
-- month X". Where a festival's only confirmed date already finished
-- before today (2026-08-05) because no later date is announced yet,
-- that date was still added for historical accuracy, but it won't
-- read as "upcoming" in the app until a newer one is added.
--
-- Explicitly EXCLUDED: 'plage-electro' — a stale duplicate of
-- 'les-plages-electroniques' that a 2026-07-06 migration
-- (20260706100000_merge_duplicate_plage_electro.sql) already merged
-- away in production. It only resurfaced in this local rebuild
-- because seed files replay after migrations here, out of their
-- original real-world order; adding dates to it would just make a
-- reintroduced duplicate harder to clean up later.
--
-- Festivals researched but NOT added here, with why (kept out of the
-- data rather than guessed):
--   bluesfest-byron-bay  — organizer entered voluntary liquidation Mar 2026, discontinued
--   dreamfields           — officially ended after "The Final Dream" Jul 2026
--   edc-china              — no 2026 edition found, appears cancelled/on hiatus since 2024-25
--   exit                    — Novi Sad edition on hiatus for 2026, replaced by a touring "Global Tour"
--   laneway-festival       — 2027 return confirmed by press but no dates yet
--   lmf                     — month announced (Jun 2026) but no exact days ever published
--   magic-of-tomorrowland  — no longer a Boom, BE event; brand now an indoor Shanghai spinoff
--   melt                    — confirmed permanently ended after its 2024 edition (27 years)
--   neversea               — appears cancelled/on hiatus for 2026, no venue secured
--   nh7-weekender          — 2027 dates not yet officially announced
--   oasis                   — brand relaunched as "Cultivora" for 2026, not continuing as Oasis
--   scream-or-dance        — no specific date announced yet
--   sonar-lisboa           — official word is no 2026 edition, returning 2027, no dates yet
--   terminal-v             — relocating after final Edinburgh edition, no new date yet
--   together               — no 2026 date announced yet
--   unseen                 — appears inactive since Aug 2024
--   valhalla               — no confirmed date found
--   vh1-supersonic         — appears on hiatus since Feb 2024
--   holy-ship-wrecked, rolling-loud, creamfields-hong-kong, vive-latino,
--   thuishaven, clockenflap, neon-countdown, splendour-in-the-grass,
--   chauffer-dans-la-noirceur, mad-cool-festival, cercle-music-festival,
--   les-deferlantes, francofolies-la-rochelle, delta-festival, womad,
--   electric-forest         — next edition not yet officially confirmed
--   solidays, wireless-festival — 2026 edition was cancelled outright
--                                  (heatwave prefecture order; Kanye West
--                                  UK entry denial), 2027 not yet announced
--
-- Data-quality note found in passing (not fixed here): the
-- 'chauffer-dans-la-noirceur' name reads like Québécois French but
-- the event itself is confirmed to run in Montmartin-sur-Mer, Normandy,
-- FRANCE — the catalog's existing FR country value is already correct,
-- just flagging that the name is misleading.
-- ============================================================

insert into public.festival_editions (festival_id, year, start_date, end_date)
select f.id, v.year, v.start_date::date, v.end_date::date
from (values
  ('808-festival', 2026, '2026-10-02', '2026-10-03'),
  ('a-state-of-trance', 2026, '2026-02-27', '2026-02-28'),
  ('afro-nation-portugal', 2027, '2027-06-09', '2027-06-11'),
  ('amf', 2026, '2026-10-24', '2026-10-24'),
  ('arc', 2026, '2026-09-04', '2026-09-07'),
  ('ava', 2026, '2026-05-29', '2026-05-30'),
  ('baum', 2026, '2026-05-22', '2026-05-23'),
  ('beonix', 2026, '2026-09-25', '2026-09-27'),
  ('beyond-the-valley', 2026, '2026-12-28', '2027-01-01'),
  ('blacklist', 2026, '2026-10-09', '2026-10-10'),
  ('bonnaroo', 2026, '2026-06-11', '2026-06-14'),
  ('boomtown', 2026, '2026-08-12', '2026-08-16'),
  ('burning-man', 2026, '2026-08-30', '2026-09-07'),
  ('cape-town-jazz-festival', 2026, '2026-03-27', '2026-03-28'),
  ('cma-fest', 2027, '2027-06-10', '2027-06-13'),
  ('corona-capital', 2026, '2026-11-20', '2026-11-22'),
  ('cosquin-rock', 2027, '2027-02-06', '2027-02-07'),
  ('creamfields', 2026, '2026-08-27', '2026-08-30'),
  ('creamfields-chile', 2026, '2026-11-14', '2026-11-15'),
  ('crssd', 2026, '2026-09-26', '2026-09-27'),
  ('defected-croatia', 2026, '2026-07-29', '2026-08-03'),
  ('defected-malta', 2026, '2026-10-01', '2026-10-05'),
  ('dekmantel', 2026, '2026-07-29', '2026-08-02'),
  ('dimensions', 2026, '2026-08-27', '2026-09-01'),
  ('djakarta-warehouse-project', 2026, '2026-12-11', '2026-12-13'),
  ('edc-orlando', 2026, '2026-11-06', '2026-11-08'),
  ('edc-thailand', 2026, '2026-12-18', '2026-12-20'),
  ('eurockeennes-de-belfort', 2026, '2026-07-02', '2026-07-05'),
  ('fcknye-festival', 2026, '2026-12-30', '2027-01-01'),
  ('fly-open-air', 2026, '2026-09-12', '2026-09-13'),
  ('glitch', 2026, '2026-08-12', '2026-08-15'),
  ('gmo-sonic', 2027, '2027-04-03', '2027-04-04'),
  ('governors-ball-music-festival', 2026, '2026-06-05', '2026-06-07'),
  ('groove-cruise', 2027, '2027-01-21', '2027-01-25'),
  ('hard-summer', 2026, '2026-08-01', '2026-08-02'),
  ('houghton', 2026, '2026-08-06', '2026-08-09'),
  ('iii-points', 2026, '2026-10-16', '2026-10-17'),
  ('isle-of-wight-festival', 2026, '2026-06-18', '2026-06-21'),
  ('java-jazz-festival', 2026, '2026-05-29', '2026-05-31'),
  ('latitude-festival', 2026, '2026-07-23', '2026-07-26'),
  ('lollapalooza', 2026, '2026-07-30', '2026-08-02'),
  ('lost-lands', 2026, '2026-09-18', '2026-09-20'),
  ('lost-village', 2026, '2026-08-27', '2026-08-30'),
  ('love-international', 2026, '2026-07-08', '2026-07-14'),
  ('lovefest', 2026, '2026-08-07', '2026-08-15'),
  ('loveland', 2026, '2026-08-08', '2026-08-09'),
  ('main-square-festival', 2026, '2026-07-03', '2026-07-05'),
  ('medusa', 2026, '2026-08-13', '2026-08-17'),
  ('mysteryland', 2025, '2025-08-22', '2025-08-24'),
  ('nature-one', 2026, '2026-07-30', '2026-08-02'),
  ('neopop', 2026, '2026-08-06', '2026-08-08'),
  ('new-orleans-jazz-fest', 2027, '2027-04-22', '2027-05-02'),
  ('newport-folk-festival', 2027, '2027-07-23', '2027-07-25'),
  ('nibirii', 2026, '2026-08-28', '2026-08-30'),
  ('north-sea-jazz-festival', 2027, '2027-07-09', '2027-07-11'),
  ('nova-rock-festival', 2027, '2027-06-10', '2027-06-12'),
  ('outlook-origins', 2026, '2026-07-23', '2026-07-27'),
  ('panorama', 2026, '2026-08-14', '2026-08-16'),
  ('pinkpop', 2027, '2027-06-18', '2027-06-20'),
  ('pitch-music-arts', 2026, '2026-03-06', '2026-03-10'),
  ('positiv', 2026, '2026-08-14', '2026-08-16'),
  ('primer', 2026, '2026-09-04', '2026-09-05'),
  ('rainbow-spirit-festival', 2026, '2026-03-06', '2026-03-09'),
  ('ravolution', 2026, '2026-06-13', '2026-06-13'),
  ('rock-am-ring', 2027, '2027-06-04', '2027-06-06'),
  ('s2o-bangkok', 2026, '2026-04-11', '2026-04-13'),
  ('s2o-hong-kong', 2026, '2026-06-08', '2026-06-09'),
  ('s2o-taiwan', 2026, '2026-06-13', '2026-06-14'),
  ('saga', 2026, '2026-08-21', '2026-08-23'),
  ('sea-star', 2026, '2026-05-28', '2026-05-31'),
  ('siam-songkran', 2026, '2026-04-11', '2026-04-14'),
  ('soundstorm', 2026, '2026-12-03', '2026-12-04'),
  ('stagecoach-festival', 2027, '2027-04-23', '2027-04-25'),
  ('sunset-by-neon', 2026, '2026-09-26', '2026-09-27'),
  ('sweden-rock-festival', 2027, '2027-06-09', '2027-06-12'),
  ('sziget', 2026, '2026-08-11', '2026-08-15'),
  ('tomorrowland', 2024, '2024-07-19', '2024-07-28'),
  ('tomorrowland', 2025, '2025-07-18', '2025-07-27'),
  ('tomorrowland', 2026, '2026-07-17', '2026-07-26'),
  ('ultra-australia', 2027, '2027-03-26', '2027-03-28'),
  ('ultra-buenos-aires', 2027, '2027-04-02', '2027-04-03'),
  ('ultra-japan', 2026, '2026-09-19', '2026-09-20'),
  ('ultra-korea', 2026, '2026-09-20', '2026-09-20'),
  ('ultra-taiwan', 2026, '2026-11-14', '2026-11-14'),
  ('untold', 2026, '2026-08-06', '2026-08-09'),
  ('untold-dubai', 2026, '2026-11-05', '2026-11-08'),
  ('veld', 2026, '2026-07-31', '2026-08-02'),
  ('verknipt', 2026, '2026-06-06', '2026-06-07'),
  ('vision-colour', 2026, '2026-04-18', '2026-04-19'),
  ('wacken-open-air', 2027, '2027-07-28', '2027-07-31'),
  ('white-party-bangkok', 2026, '2026-12-29', '2027-01-02'),
  ('world-dj-festival', 2026, '2026-06-13', '2026-06-14')
) as v(slug, year, start_date, end_date)
join public.festivals f on f.slug = v.slug
on conflict (festival_id, year) do update
  set start_date = excluded.start_date, end_date = excluded.end_date;
