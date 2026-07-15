-- ============================================================
-- Follow-up to the Lot 2/Lot 3 festival-data audit (2026-07-15).
--
-- 1) Three festivals not covered by Lot 3 (added to the catalog
--    after that audit, or newly confirmed since):
--    - Electric Mountain Festival: 2026 edition already passed with
--      no lineup on record; 2027 dates are now officially announced.
--    - Glastonbury Festival: 2026 is a confirmed fallow year (no
--      event); 2027 dates are now officially announced.
--    - Luxembourg Open Air: 2027 dates officially announced (2026
--      "Season Opening" edition already passed).
--
-- 2) Two Lot 2 "no lineup announced" festivals now have one, since
--    time has passed since that audit: Lovefest, SAGA Festival.
--    Idempotent: upserts on (festival_id, year) / guards on existing
--    artist name / upserts on (edition_id, artist_id) — safe to re-run.
-- ============================================================

insert into public.festival_editions (festival_id, year, start_date, end_date)
select f.id, v.year, v.start_date::date, v.end_date::date
from (values
  ('electric-mountain-festival', 2027, '2027-04-12', '2027-04-17'),
  ('glastonbury', 2027, '2027-06-23', '2027-06-27'),
  ('luxembourg-open-air', 2027, '2027-05-21', '2027-05-22')
) as v(slug, year, start_date, end_date)
join public.festivals f on f.slug = v.slug
on conflict (festival_id, year) do update
  set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.artists (name)
select v.name
from (values
  ('ARTBAT'), ('Nina Kraviz'), ('Jamie Jones'), ('Joseph Capriati'), ('Loco Dice'),
  ('Louie Vega'), ('Anfisa Letyago'), ('Pan-Pot'), ('Octave One'), ('Leon Vynehall'),
  ('Faustix'), ('Madism'), ('Cuebrick'), ('ItaloBrothers'), ('Mira'), ('Honey Gee')
) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(slug, artist_name, order_index) as (
  values
    -- Lovefest 2026
    ('lovefest', 'ARTBAT', 0), ('lovefest', 'Nina Kraviz', 1),
    ('lovefest', 'Jamie Jones', 2), ('lovefest', 'Joseph Capriati', 3),
    ('lovefest', 'Loco Dice', 4), ('lovefest', 'Louie Vega', 5),
    ('lovefest', 'Anfisa Letyago', 6), ('lovefest', 'Pan-Pot', 7),
    ('lovefest', 'Octave One', 8), ('lovefest', 'Leon Vynehall', 9),

    -- SAGA Festival 2026
    ('saga', 'Faustix', 0), ('saga', 'Madism', 1),
    ('saga', 'Cuebrick', 2), ('saga', 'ItaloBrothers', 3),
    ('saga', 'Mira', 4), ('saga', 'Honey Gee', 5)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = l.slug
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id
  and e.year = 2026
  and f.slug in ('lovefest', 'saga');
