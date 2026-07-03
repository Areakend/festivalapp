-- ============================================================
-- Festiq — sample seed data
-- 12 well-known festivals, 2026 editions, DJ Mag rankings and a
-- sample lineup for Tomorrowland 2026 (for playlist generation).
-- The full DJ Mag Top 100 is curated in djmag_top100.sample.json
-- and imported with scripts/import-djmag (see docs).
-- ============================================================

insert into public.festivals
  (name, slug, description, country, city, venue, latitude, longitude, genres, number_of_stages, capacity, first_year, official_website)
values
  ('Tomorrowland', 'tomorrowland', 'The world''s most iconic electronic music festival, held in the magical setting of De Schorre.', 'BE', 'Boom', 'De Schorre', 51.0885, 4.3719, '{house,techno,edm,trance,hardstyle}', 16, 400000, 2005, 'https://www.tomorrowland.com'),
  ('Ultra Music Festival', 'ultra-miami', 'Miami''s flagship EDM festival kicking off the festival season every March.', 'US', 'Miami', 'Bayfront Park', 25.7753, -80.1866, '{edm,house,techno,trance}', 8, 165000, 1999, 'https://ultramusicfestival.com'),
  ('EDC Las Vegas', 'edc-las-vegas', 'Electric Daisy Carnival — a neon wonderland under the electric sky.', 'US', 'Las Vegas', 'Las Vegas Motor Speedway', 36.2724, -115.0136, '{edm,house,techno,hardstyle,dubstep}', 9, 525000, 1997, 'https://lasvegas.electricdaisycarnival.com'),
  ('Awakenings', 'awakenings', 'The world''s leading techno festival, pure and uncompromising.', 'NL', 'Hilvarenbeek', 'Beekse Bergen', 51.5232, 5.1181, '{techno}', 8, 110000, 1997, 'https://www.awakenings.com'),
  ('Creamfields', 'creamfields', 'The UK''s biggest dance music festival, a Bank Holiday institution.', 'GB', 'Daresbury', 'Daresbury Estate', 53.3439, -2.6375, '{edm,house,techno,trance}', 10, 80000, 1998, 'https://www.creamfields.com'),
  ('Untold', 'untold', 'Transylvania''s epic story-driven festival in the heart of Cluj-Napoca.', 'RO', 'Cluj-Napoca', 'Cluj Arena', 46.7688, 23.5723, '{edm,house,techno,trance}', 10, 100000, 2015, 'https://untold.com'),
  ('Sziget', 'sziget', 'The Island of Freedom — a week-long multi-genre celebration on the Danube.', 'HU', 'Budapest', 'Óbudai-sziget', 47.5514, 19.0522, '{pop,rock,electronic,indie}', 60, 95000, 1993, 'https://szigetfestival.com'),
  ('Coachella', 'coachella', 'The trend-setting desert festival blending music, art and culture.', 'US', 'Indio', 'Empire Polo Club', 33.6803, -116.2378, '{pop,rock,electronic,hiphop}', 8, 125000, 1999, 'https://www.coachella.com'),
  ('Mysteryland', 'mysteryland', 'The Netherlands'' longest-running dance festival, full of wonder.', 'NL', 'Haarlemmermeer', 'Floriade terrain', 52.2707, 4.6519, '{house,techno,hardstyle,edm}', 12, 100000, 1993, 'https://www.mysteryland.com'),
  ('EXIT Festival', 'exit', 'Award-winning festival held in the Petrovaradin Fortress.', 'RS', 'Novi Sad', 'Petrovaradin Fortress', 45.2526, 19.8615, '{electronic,rock,techno,hiphop}', 40, 55000, 2000, 'https://www.exitfest.org'),
  ('Parookaville', 'parookaville', 'Germany''s craziest pop-up city of electronic music.', 'DE', 'Weeze', 'Airport Weeze', 51.6024, 6.1421, '{edm,house,hardstyle,techno}', 10, 75000, 2015, 'https://www.parookaville.com'),
  ('Defqon.1', 'defqon-1', 'The world''s largest harder-styles festival. Unite as one.', 'NL', 'Biddinghuizen', 'Evenemententerrein Walibi', 52.4416, 5.7644, '{hardstyle,hardcore,raw}', 14, 85000, 2003, 'https://www.q-dance.com/defqon-1');

-- ---------- 2026 editions ----------
insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select id, 2026,
  case slug
    when 'tomorrowland' then date '2026-07-17'
    when 'ultra-miami' then date '2026-03-27'
    when 'edc-las-vegas' then date '2026-05-15'
    when 'awakenings' then date '2026-07-10'
    when 'creamfields' then date '2026-08-27'
    when 'untold' then date '2026-08-06'
    when 'sziget' then date '2026-08-10'
    when 'coachella' then date '2026-04-10'
    when 'mysteryland' then date '2026-08-28'
    when 'exit' then date '2026-07-09'
    when 'parookaville' then date '2026-07-17'
    when 'defqon-1' then date '2026-06-26'
  end,
  case slug
    when 'tomorrowland' then date '2026-07-26'
    when 'ultra-miami' then date '2026-03-29'
    when 'edc-las-vegas' then date '2026-05-17'
    when 'awakenings' then date '2026-07-12'
    when 'creamfields' then date '2026-08-30'
    when 'untold' then date '2026-08-09'
    when 'sziget' then date '2026-08-15'
    when 'coachella' then date '2026-04-19'
    when 'mysteryland' then date '2026-08-30'
    when 'exit' then date '2026-07-12'
    when 'parookaville' then date '2026-07-19'
    when 'defqon-1' then date '2026-06-28'
  end,
  slug = 'tomorrowland'
from public.festivals;

-- ---------- DJ Mag rankings (sample; full list via import script) ----------
insert into public.djmag_rankings (festival_id, year, rank_position)
select f.id, r.year, r.rank
from (values
  ('tomorrowland', 2025, 1), ('tomorrowland', 2024, 1),
  ('edc-las-vegas', 2025, 2), ('edc-las-vegas', 2024, 3),
  ('ultra-miami', 2025, 3), ('ultra-miami', 2024, 2),
  ('creamfields', 2025, 4), ('creamfields', 2024, 5),
  ('untold', 2025, 5), ('untold', 2024, 4),
  ('awakenings', 2025, 8), ('awakenings', 2024, 9),
  ('exit', 2025, 12), ('exit', 2024, 11),
  ('parookaville', 2025, 15), ('parookaville', 2024, 17),
  ('mysteryland', 2025, 18), ('mysteryland', 2024, 16),
  ('defqon-1', 2025, 20), ('defqon-1', 2024, 22)
) as r(slug, year, rank)
join public.festivals f on f.slug = r.slug;

-- ---------- sample artists + Tomorrowland 2026 lineup ----------
insert into public.artists (name, spotify_artist_id, genres) values
  ('Martin Garrix', '60d24wfXkVzDSfLS6hyCjZ', '{edm,progressive house}'),
  ('Charlotte de Witte', '1lJhME1ZpzsEa5M0wW6Mso', '{techno}'),
  ('Amelie Lens', '4MpUJvGlaQ2791PWXVXtBF', '{techno}'),
  ('Armin van Buuren', '0SfsnGyD8FpIN4U4WCkBZ5', '{trance}'),
  ('David Guetta', '1Cs0zKBU1kc0i8ypK3B9ai', '{edm,house}'),
  ('Swedish House Mafia', '1h1s0nB1u5rOOFRJlY9viX', '{progressive house,edm}'),
  ('Angerfist', '2xLmMy3rVd6yUiu9RVWfxx', '{hardcore}'),
  ('FISHER', '4o1TzUCv8gwia67pjJVMhr', '{tech house}');

insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, row_number() over () - 1
from public.festival_editions e
join public.festivals f on f.id = e.festival_id and f.slug = 'tomorrowland' and e.year = 2026
cross join public.artists a;
