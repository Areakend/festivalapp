-- ============================================================
-- Lot 2 of the festival-data audit: festivals that had a 2026
-- festival_editions row but zero artists.
--
-- Researched all 12: 808 Festival, Burning Man, Creamfields Chile,
-- Lovefest, S2O Hong Kong, SAGA, Soundstorm, Sónar Lisboa, Ultra
-- Taiwan and White Party Bangkok genuinely have NO 2026 lineup
-- announced yet as of this writing (most are Q4 2026 events, still
-- months out) — nothing real to add, so they're left untouched
-- rather than filled with fabricated or stale prior-year names.
--
-- Two exceptions handled below:
-- 1) Djakarta Warehouse Project: 4 confirmed 2026 headliners.
-- 2) Mysteryland: organizers (ID&T) confirmed in July 2025 that
--    Mysteryland is skipping 2026 entirely ("starting from scratch",
--    returning 2027) — its 2026 festival_editions row is simply
--    wrong (the festival isn't happening this year), so it's removed
--    rather than given a fabricated lineup.
-- ============================================================

insert into public.artists (name)
select v.name
from (values ('Tiësto'), ('Kygo'), ('Marshmello')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);
-- Martin Garrix already exists in public.artists (seeded for Tomorrowland).

with lineup(slug, artist_name, order_index) as (
  values
    ('djakarta-warehouse-project', 'Martin Garrix', 0),
    ('djakarta-warehouse-project', 'Tiësto', 1),
    ('djakarta-warehouse-project', 'Kygo', 2),
    ('djakarta-warehouse-project', 'Marshmello', 3)
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
where e.festival_id = f.id and e.year = 2026 and f.slug = 'djakarta-warehouse-project';

-- Mysteryland isn't happening in 2026 at all — remove the erroneous edition.
delete from public.festival_editions e
using public.festivals f
where e.festival_id = f.id and f.slug = 'mysteryland' and e.year = 2026;
