-- ============================================================
-- Batch 2 of confirmed 2027 dates, continuing 2027_dates_confirmed.sql
-- (which covered festivals whose 2026 edition finished as of
-- 2026-07-18). This batch was researched 2026-07-29, prioritizing
-- festivals whose 2026 edition finished most recently, plus a few
-- major worldwide franchises (Coachella, Ultra, EDC Mexico...) that
-- tend to announce far ahead.
--
-- Only officially-confirmed dates were added (festival's own site, or
-- a named outlet with a dated article/press release) — skipped
-- anything phrased as "predicted", "expected", or "not yet announced"
-- by its own sources rather than guessed from last year's pattern.
--
-- This is a partial pass, not exhaustive: about half of the ~75
-- festivals with a finished-and-undated latest edition were checked
-- (the ones finished most recently, where a 2027 announcement is
-- most likely to already exist). The rest can be researched in a
-- follow-up. Skipped explicitly per source: Mad Cool (dates found but
-- explicitly flagged "unconfirmed"), A State Of Trance, Bonnaroo,
-- Electric Forest, Ultra Australia, Splendour in the Grass, Les
-- Déferlantes, Francofolies de La Rochelle, Love International,
-- Outlook Origins, Delta Festival, WOMAD, Tomorrowland (Belgium) —
-- all still "not yet announced" as of this search.
--
-- Data-quality note (not fixed here, flagging for a decision): MELT
-- Festival permanently ended after its 2024 edition ("stop running
-- after 27 years" per press) — no 2027 date exists to add, but the
-- catalog's existing `melt` row already carries a 2026
-- festival_editions entry that contradicts this and was flagged as
-- likely erroneous in an earlier audit. Left untouched pending a
-- decision on whether to correct/remove it.
-- ============================================================

insert into public.festival_editions (festival_id, year, start_date, end_date)
select f.id, 2027, v.start_date::date, v.end_date::date
from (values
  ('fuji-rock-festival',   '2027-07-23', '2027-07-25'),
  ('monegros',              '2027-07-31', '2027-07-31'),
  ('dour-festival',         '2027-07-14', '2027-07-18'),
  ('electric-castle',       '2027-07-19', '2027-07-23'),
  ('les-vieilles-charrues', '2027-07-15', '2027-07-18'),
  ('lollapalooza-berlin',   '2027-07-17', '2027-07-18'),
  ('parookaville',          '2027-07-16', '2027-07-18'),
  ('colours-of-ostrava',    '2027-07-21', '2027-07-24'),
  ('montreux-jazz-festival','2027-07-02', '2027-07-17'),
  ('balaton-sound',         '2027-06-29', '2027-07-02'),
  ('bilbao-bbk-live',       '2027-07-08', '2027-07-10'),
  ('beats-for-love',        '2027-07-01', '2027-07-05'),
  ('opener-festival',       '2027-06-30', '2027-07-03'),
  ('roskilde-festival',     '2027-06-26', '2027-07-03'),
  ('graspop-metal-meeting', '2027-06-17', '2027-06-20'),
  ('download-festival',     '2027-06-09', '2027-06-13'),
  ('coachella',              '2027-04-09', '2027-04-18'),
  ('ultra-miami',            '2027-03-26', '2027-03-28'),
  ('edc-mexico',             '2027-02-19', '2027-02-21'),
  ('primavera-sound',        '2027-06-03', '2027-06-05'),
  ('time-warp',              '2027-04-03', '2027-04-03'),
  ('beyond-wonderland',      '2027-03-26', '2027-03-27'),
  ('tomorrowland-winter',    '2027-03-20', '2027-03-27'),
  ('snowbombing',            '2027-04-05', '2027-04-10'),
  ('dgtl',                   '2027-03-26', '2027-03-28'),
  ('ultra-south-africa',     '2027-04-30', '2027-05-01')
) as v(slug, start_date, end_date)
join public.festivals f on f.slug = v.slug
on conflict (festival_id, year) do update
  set start_date = excluded.start_date, end_date = excluded.end_date;
