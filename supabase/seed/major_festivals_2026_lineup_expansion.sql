-- ============================================================
-- Expands lineups for major festivals that were stuck at a handful
-- of headliners despite huge real bills (Tomorrowland had only the
-- original 8 sample artists from seed.sql; Coachella, Defqon.1,
-- Sziget and Time Warp were similarly thin). Also corrects two
-- festival_editions start dates that were off by a day.
-- Sourced from official festival sites, DJ Mag, RA and festival press.
-- Idempotent: artist inserts guard on existing name (case-insensitive),
-- lineup inserts upsert on (edition_id, artist_id) — safe to re-run.
--
-- EXIT Festival is deliberately NOT touched here: its 2026 edition
-- isn't happening at Petrovaradin Fortress at all (political pressure
-- from Serbian authorities forced a format change to a multi-country
-- "Global Tour" with stops still being announced) — the existing
-- Novi Sad dates/venue for 2026 are wrong, but our schema has no way
-- to represent a single festival with several simultaneous
-- cities/dates in one edition, so this needs a product decision
-- rather than a data fix.
-- ============================================================

insert into public.artists (name)
select v.name
from (values
  -- Tomorrowland 2026 (Mainstage + notable b2b sets, weekends 1 & 2)
  ('Hardwell'), ('Calvin Harris'), ('Dimitri Vegas & Like Mike'), ('Sebastian Ingrosso'),
  ('Lost Frequencies'), ('Henri PFR'), ('Kevin de Vries'), ('Agents Of Time'),
  ('The Chainsmokers'), ('Sub Zero Project'), ('Avalon Emerson'), ('Ben UFO'),
  ('Sasha'), ('Young Marco'), ('HAAi'), ('The Blessed Madonna'), ('Miss Monique'),
  ('Indira Paganotto'), ('John Summit'), ('James Hype'), ('Afrojack'), ('Netsky'),
  ('Alok'), ('Mind Against'), ('B Jones'), ('Malugi'), ('Hannah Laing'), ('Novah'),
  ('Timmy Trumpet'), ('KETTAMA'), ('Michael Bibi'), ('AYYBO'), ('Odd Mob'),
  ('HI-LO'), ('Layton Giordani'), ('BiiA'), ('Charlie Sparks'),

  -- Coachella 2026
  ('The xx'), ('The Strokes'), ('Addison Rae'), ('Young Thug'), ('KATSEYE'),
  ('BIGBANG'), ('Ethel Cain'), ('Interpol'), ('Alex G'), ('Turnstile'), ('Dijon'),
  ('Laufey'), ('Wet Leg'), ('Clipse'), ('BINI'),

  -- Defqon.1 2026
  ('Sound Rush'), ('D-Block & S-te-Fan'), ('Da Tweekaz'), ('Wildstylez'),
  ('Atmozfears'), ('Audiotricz'), ('Frequencerz'), ('Bass Modulators'),
  ('Evil Activities'), ('Miss K8'), ('Dr. Peacock'),

  -- Sziget 2026
  ('Bring Me The Horizon'), ('Zara Larsson'), ('Argy'), ('Boys Noize'),
  ('Charlotte Cardin'), ('Chet Faker'), ('Dimension'), ('Funk Tribu'),
  ('Loyle Carner'), ('Nia Archives'), ('Parcels'), ('Richie Hawtin'),
  ('Sara Landry'), ('Sub Focus'), ('Tash Sultana'), ('Trym'), ('Vintage Culture'),
  ('WhoMadeWho'), ('Wolf Alice'), ('Natasha Bedingfield'),

  -- Time Warp 2026
  ('Ben Klock'), ('MARRØN'), ('Blawan'), ('Freddy K'), ('Adiel'), ('ALISHA'),
  ('Chris Liebing'), ('Speedy J'), ('Charlotte de Witte'), ('I Hate Models'),
  ('Enrico Sangiuliano')
) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

-- Defqon.1's real 2026 dates are Jun 25-28 (Thursday campground open
-- through Legends Day Sunday), a day earlier than previously seeded.
-- Sziget's are Aug 11-15 (Tue-Sat), a day later than previously seeded.
update public.festival_editions e
set start_date = v.start_date::date
from public.festivals f, (values
  ('defqon-1', '2026-06-25'),
  ('sziget', '2026-08-11')
) as v(slug, start_date)
where e.festival_id = f.id and f.slug = v.slug and e.year = 2026;

with lineup(slug, artist_name, order_index) as (
  values
    -- Tomorrowland 2026
    ('tomorrowland', 'Hardwell', 100), ('tomorrowland', 'Calvin Harris', 101),
    ('tomorrowland', 'Dimitri Vegas & Like Mike', 102), ('tomorrowland', 'Sebastian Ingrosso', 103),
    ('tomorrowland', 'Lost Frequencies', 104), ('tomorrowland', 'Henri PFR', 105),
    ('tomorrowland', 'Kevin de Vries', 106), ('tomorrowland', 'Agents Of Time', 107),
    ('tomorrowland', 'The Chainsmokers', 108), ('tomorrowland', 'Sub Zero Project', 109),
    ('tomorrowland', 'Avalon Emerson', 110), ('tomorrowland', 'Ben UFO', 111),
    ('tomorrowland', 'Sasha', 112), ('tomorrowland', 'Young Marco', 113),
    ('tomorrowland', 'HAAi', 114), ('tomorrowland', 'The Blessed Madonna', 115),
    ('tomorrowland', 'Miss Monique', 116), ('tomorrowland', 'Indira Paganotto', 117),
    ('tomorrowland', 'John Summit', 118), ('tomorrowland', 'James Hype', 119),
    ('tomorrowland', 'Afrojack', 120), ('tomorrowland', 'Netsky', 121),
    ('tomorrowland', 'Alok', 122), ('tomorrowland', 'Mind Against', 123),
    ('tomorrowland', 'B Jones', 124), ('tomorrowland', 'Malugi', 125),
    ('tomorrowland', 'Hannah Laing', 126), ('tomorrowland', 'Novah', 127),
    ('tomorrowland', 'Timmy Trumpet', 128), ('tomorrowland', 'KETTAMA', 129),
    ('tomorrowland', 'Michael Bibi', 130), ('tomorrowland', 'AYYBO', 131),
    ('tomorrowland', 'Odd Mob', 132), ('tomorrowland', 'HI-LO', 133),
    ('tomorrowland', 'Layton Giordani', 134), ('tomorrowland', 'BiiA', 135),
    ('tomorrowland', 'Charlie Sparks', 136),

    -- Coachella 2026
    ('coachella', 'The xx', 100), ('coachella', 'The Strokes', 101),
    ('coachella', 'Addison Rae', 102), ('coachella', 'Young Thug', 103),
    ('coachella', 'KATSEYE', 104), ('coachella', 'BIGBANG', 105),
    ('coachella', 'Ethel Cain', 106), ('coachella', 'Interpol', 107),
    ('coachella', 'Alex G', 108), ('coachella', 'Turnstile', 109),
    ('coachella', 'Dijon', 110), ('coachella', 'Laufey', 111),
    ('coachella', 'Wet Leg', 112), ('coachella', 'Clipse', 113),
    ('coachella', 'BINI', 114),

    -- Defqon.1 2026
    ('defqon-1', 'Sound Rush', 100), ('defqon-1', 'D-Block & S-te-Fan', 101),
    ('defqon-1', 'Da Tweekaz', 102), ('defqon-1', 'Wildstylez', 103),
    ('defqon-1', 'Atmozfears', 104), ('defqon-1', 'Audiotricz', 105),
    ('defqon-1', 'Frequencerz', 106), ('defqon-1', 'Bass Modulators', 107),
    ('defqon-1', 'Evil Activities', 108), ('defqon-1', 'Miss K8', 109),
    ('defqon-1', 'Dr. Peacock', 110),

    -- Sziget 2026
    ('sziget', 'Bring Me The Horizon', 100), ('sziget', 'Zara Larsson', 101),
    ('sziget', 'Argy', 102), ('sziget', 'Boys Noize', 103),
    ('sziget', 'Charlotte Cardin', 104), ('sziget', 'Chet Faker', 105),
    ('sziget', 'Dimension', 106), ('sziget', 'Funk Tribu', 107),
    ('sziget', 'Loyle Carner', 108), ('sziget', 'Nia Archives', 109),
    ('sziget', 'Parcels', 110), ('sziget', 'Richie Hawtin', 111),
    ('sziget', 'Sara Landry', 112), ('sziget', 'Sub Focus', 113),
    ('sziget', 'Tash Sultana', 114), ('sziget', 'Trym', 115),
    ('sziget', 'Vintage Culture', 116), ('sziget', 'WhoMadeWho', 117),
    ('sziget', 'Wolf Alice', 118), ('sziget', 'Natasha Bedingfield', 119),

    -- Time Warp 2026
    ('time-warp', 'Ben Klock', 100), ('time-warp', 'MARRØN', 101),
    ('time-warp', 'Blawan', 102), ('time-warp', 'Freddy K', 103),
    ('time-warp', 'Adiel', 104), ('time-warp', 'ALISHA', 105),
    ('time-warp', 'Chris Liebing', 106), ('time-warp', 'Speedy J', 107),
    ('time-warp', 'Charlotte de Witte', 108), ('time-warp', 'I Hate Models', 109),
    ('time-warp', 'Enrico Sangiuliano', 110)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = l.slug
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;
