-- AMF was 3 editions behind (last recorded: 2023) — backfills the missing
-- 2025 edition (Oct 25, 2025, Johan Cruijff ArenA) with its documented
-- lineup, plus the already-announced partial lineup for the upcoming 2026
-- edition (Oct 24, 2026, same venue, ADE 30th-anniversary week). 2024 was
-- skipped: confirmed to have happened but no reliable date/lineup source
-- found, left for a future pass rather than guessed.
--
-- Also fills out Luxembourg Open Air 2025 (8 -> 18 artists) and SUNSET By
-- NEON 2026 (5 -> 9 artists) from newly-found official announcements.

insert into festival_editions (festival_id, year, start_date, end_date) select f.id, 2025, '2025-10-25', '2025-10-25' from festivals f where f.slug='amf' on conflict (festival_id, year) do nothing;


-- amf 2025

insert into public.artists (name)
select v.name
from (values ('Armin van Buuren'), ('Hardwell'), ('AfroSalto'), ('John Summit'), ('Sara Landry'), ('KI/KI'), ('Miss Monique'), ('MORTEN'), ('Oliver Heldens'), ('Sub Zero Project')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values ('Armin van Buuren', 0), ('Hardwell', 1), ('AfroSalto', 2), ('John Summit', 3), ('Sara Landry', 4), ('KI/KI', 5), ('Miss Monique', 6), ('MORTEN', 7), ('Oliver Heldens', 8), ('Sub Zero Project', 9)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'amf'
join public.festival_editions e on e.festival_id = f.id and e.year = 2025
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'amf' and e.year = 2025;

-- amf 2026

insert into public.artists (name)
select v.name
from (values ('Afrojack'), ('Amelie Lens'), ('Armin van Buuren'), ('ARTBAT'), ('D-Block & S-te-Fan'), ('David Guetta'), ('Korolova'), ('Marlon Hoffstadt')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values ('Afrojack', 0), ('Amelie Lens', 1), ('Armin van Buuren', 2), ('ARTBAT', 3), ('D-Block & S-te-Fan', 4), ('David Guetta', 5), ('Korolova', 6), ('Marlon Hoffstadt', 7)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'amf'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'amf' and e.year = 2026;

-- luxembourg-open-air 2025

insert into public.artists (name)
select v.name
from (values ('John Newman'), ('Nervo'), ('Topic'), ('Jaxomy'), ('Biscits'), ('Toby Romeo'), ('Matt Sassari'), ('Kommando'), ('Xenia'), ('Luciid'), ('W&W'), ('Maddix'), ('Avaion'), ('Bennett'), ('DJs From Mars'), ('Tita Lau'), ('The Rocketman'), ('Joshwa')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values ('John Newman', 0), ('Nervo', 1), ('Topic', 2), ('Jaxomy', 3), ('Biscits', 4), ('Toby Romeo', 5), ('Matt Sassari', 6), ('Kommando', 7), ('Xenia', 8), ('Luciid', 9), ('W&W', 10), ('Maddix', 11), ('Avaion', 12), ('Bennett', 13), ('DJs From Mars', 14), ('Tita Lau', 15), ('The Rocketman', 16), ('Joshwa', 17)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'luxembourg-open-air'
join public.festival_editions e on e.festival_id = f.id and e.year = 2025
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'luxembourg-open-air' and e.year = 2025;

-- sunset-by-neon 2026

insert into public.artists (name)
select v.name
from (values ('ARTBAT'), ('R3HAB'), ('Chris Avantgarde'), ('7Skies'), ('PlastiK Funk'), ('Yotto'), ('Agents Of Time'), ('Rivo'), ('SLVR')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values ('ARTBAT', 0), ('R3HAB', 1), ('Chris Avantgarde', 2), ('7Skies', 3), ('PlastiK Funk', 4), ('Yotto', 5), ('Agents Of Time', 6), ('Rivo', 7), ('SLVR', 8)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'sunset-by-neon'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'sunset-by-neon' and e.year = 2026;
