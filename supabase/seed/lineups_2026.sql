-- ============================================================
-- Real 2026 lineups for the festivals already seeded with a 2026
-- edition (see seed.sql). Sourced from official announcements /
-- press coverage (DJ Mag, EDM.com, RA, festival sites) — headliner
-- and notable-artist subsets, not full 100+ act bills.
--
-- spotify_artist_id is left null on purpose: generate-playlist
-- resolves artists via live Spotify search on first use and caches
-- the match back onto the row, so we don't need to hand-guess IDs.
--
-- Mysteryland is skipped: it is on a confirmed hiatus in 2026
-- (returning 2027), so no real lineup exists to seed.
-- ============================================================

insert into public.artists (name, genres)
select v.name, v.genres
from (values
  ('Sara Landry', '{techno}'::text[]),
  ('Bzrp', '{reggaeton,hiphop}'::text[]),
  ('Deorro', '{edm}'::text[]),
  ('Mike Posner', '{pop}'::text[]),
  ('Morten', '{edm}'::text[]),
  ('999999999', '{techno}'::text[]),
  ('Adam Beyer', '{techno}'::text[]),
  ('Joseph Capriati', '{techno}'::text[]),
  ('Adriatique', '{techno}'::text[]),
  ('Eric Prydz', '{progressive house}'::text[]),
  ('Carl Cox', '{techno,house}'::text[]),
  ('Illenium', '{edm,dubstep}'::text[]),
  ('Hardwell', '{edm,big room}'::text[]),
  ('DJ Snake', '{edm,hiphop}'::text[]),
  ('Sebastian Ingrosso', '{progressive house}'::text[]),
  ('Steve Angello', '{progressive house}'::text[]),
  ('Alesso', '{edm,progressive house}'::text[]),
  ('The Prodigy', '{electronic,punk}'::text[]),
  ('Tiësto', '{edm,house}'::text[]),
  ('Zedd', '{edm,pop}'::text[]),
  ('Steve Aoki', '{edm}'::text[]),
  ('Kaskade', '{house,edm}'::text[]),
  ('The Chainsmokers', '{edm,pop}'::text[]),
  ('Paul van Dyk', '{trance}'::text[]),
  ('Porter Robinson', '{edm,electropop}'::text[]),
  ('John Summit', '{house}'::text[]),
  ('GRiZ', '{funk,edm}'::text[]),
  ('Wooli', '{dubstep}'::text[]),
  ('San Holo', '{future bass}'::text[]),
  ('Seven Lions', '{dubstep,melodic bass}'::text[]),
  ('Interplanetary Criminal', '{bassline,uk garage}'::text[]),
  ('Hannah Laing', '{hard dance,techno}'::text[]),
  ('Joris Voorn', '{techno,house}'::text[]),
  ('Kevin de Vries', '{techno,house}'::text[]),
  ('Freddy K', '{techno}'::text[]),
  ('Nina Kraviz', '{techno}'::text[]),
  ('I Hate Models', '{techno}'::text[]),
  ('Ben Klock', '{techno}'::text[]),
  ('Len Faki', '{techno}'::text[]),
  ('Speedy J', '{techno}'::text[]),
  ('Rødhåd', '{techno}'::text[]),
  ('Bart Skils', '{techno}'::text[]),
  ('Cloonee', '{tech house}'::text[]),
  ('Pan-Pot', '{techno}'::text[]),
  ('Sabrina Carpenter', '{pop}'::text[]),
  ('Justin Bieber', '{pop}'::text[]),
  ('Karol G', '{reggaeton,latin}'::text[]),
  ('Anyma', '{melodic techno}'::text[]),
  ('Disclosure', '{house,uk garage}'::text[]),
  ('FKA Twigs', '{alt r&b,electronic}'::text[]),
  ('Nine Inch Nails', '{industrial rock}'::text[]),
  ('Iggy Pop', '{punk rock}'::text[]),
  ('David Byrne', '{art rock}'::text[]),
  ('Moby', '{electronic}'::text[]),
  ('Devo', '{new wave}'::text[]),
  ('Kygo', '{tropical house}'::text[]),
  ('Lost Frequencies', '{edm,house}'::text[]),
  ('Marshmello', '{edm,future bass}'::text[]),
  ('Afrojack', '{edm,house}'::text[]),
  ('R3HAB', '{edm,house}'::text[]),
  ('Flo Rida', '{hiphop}'::text[]),
  ('Swae Lee', '{hiphop}'::text[]),
  ('Tash Sultana', '{alternative}'::text[]),
  ('Denzel Curry', '{hiphop}'::text[]),
  ('Andy C', '{dnb}'::text[]),
  ('Gordo', '{tech house}'::text[]),
  ('Shimza', '{afro house}'::text[]),
  ('WhoMadeWho', '{electronic,indie}'::text[]),
  ('D-Sturb', '{hardstyle}'::text[]),
  ('Brennan Heart', '{hardstyle}'::text[]),
  ('Phuture Noize', '{hardstyle}'::text[]),
  ('Sefa', '{hardstyle}'::text[]),
  ('Radical Redemption', '{hardcore}'::text[]),
  ('Coone', '{hardstyle}'::text[]),
  ('DJ Isaac', '{hardstyle}'::text[]),
  ('Ran-D', '{hardstyle}'::text[]),
  ('Adaro', '{hardstyle}'::text[]),
  ('Hysta', '{hardstyle}'::text[]),
  ('Calvin Harris', '{edm,pop}'::text[]),
  ('Duke Dumont', '{house}'::text[]),
  ('Dom Dolla', '{house}'::text[]),
  ('Gorgon City', '{house}'::text[]),
  ('Sonny Fodera', '{house}'::text[]),
  ('CamelPhat', '{house,techno}'::text[]),
  ('Chris Stussy', '{house}'::text[]),
  ('Kettama', '{house}'::text[]),
  ('Chloé Caillet', '{house,techno}'::text[]),
  ('Florence + the Machine', '{indie rock}'::text[]),
  ('Lewis Capaldi', '{pop}'::text[]),
  ('Sombr', '{indie pop}'::text[]),
  ('Twenty One Pilots', '{alternative}'::text[]),
  ('Ashnikko', '{pop,hyperpop}'::text[]),
  ('Biffy Clyro', '{alt rock}'::text[]),
  ('Peggy Gou', '{house}'::text[]),
  ('Underworld', '{electronic}'::text[]),
  ('Skepta', '{grime,hiphop}'::text[]),
  ('Jorja Smith', '{r&b}'::text[]),
  ('Sigrid', '{pop}'::text[]),
  ('Soulwax', '{electronic}'::text[]),
  ('Gorillaz', '{alternative,hiphop}'::text[]),
  ('Timmy Trumpet', '{edm,hardstyle}'::text[]),
  ('W&W', '{edm,hardstyle}'::text[]),
  ('Don Diablo', '{future house}'::text[]),
  ('Bovski', '{house}'::text[]),
  ('Cassian', '{house}'::text[])
) as v(name, genres)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

-- ---------- lineups per 2026 edition ----------
with lineup(slug, artist_name, order_index) as (
  values
    -- Ultra Music Festival (Miami) 2026
    ('ultra-miami', 'Martin Garrix', 0), ('ultra-miami', 'Alesso', 1),
    ('ultra-miami', 'Amelie Lens', 2), ('ultra-miami', 'Sara Landry', 3),
    ('ultra-miami', 'Bzrp', 4), ('ultra-miami', 'Deorro', 5),
    ('ultra-miami', 'Mike Posner', 6), ('ultra-miami', 'Morten', 7),
    ('ultra-miami', '999999999', 8), ('ultra-miami', 'Adam Beyer', 9),
    ('ultra-miami', 'Joseph Capriati', 10), ('ultra-miami', 'Adriatique', 11),
    ('ultra-miami', 'Eric Prydz', 12), ('ultra-miami', 'Armin van Buuren', 13),
    ('ultra-miami', 'Carl Cox', 14), ('ultra-miami', 'Illenium', 15),
    ('ultra-miami', 'Hardwell', 16), ('ultra-miami', 'DJ Snake', 17),
    ('ultra-miami', 'Sebastian Ingrosso', 18), ('ultra-miami', 'Steve Angello', 19),

    -- EDC Las Vegas 2026
    ('edc-las-vegas', 'Martin Garrix', 0), ('edc-las-vegas', 'Charlotte de Witte', 1),
    ('edc-las-vegas', 'The Prodigy', 2), ('edc-las-vegas', 'Tiësto', 3),
    ('edc-las-vegas', 'Zedd', 4), ('edc-las-vegas', 'Steve Aoki', 5),
    ('edc-las-vegas', 'Kaskade', 6), ('edc-las-vegas', 'The Chainsmokers', 7),
    ('edc-las-vegas', 'Paul van Dyk', 8), ('edc-las-vegas', 'Porter Robinson', 9),
    ('edc-las-vegas', 'John Summit', 10), ('edc-las-vegas', 'GRiZ', 11),
    ('edc-las-vegas', 'Wooli', 12), ('edc-las-vegas', 'FISHER', 13),
    ('edc-las-vegas', 'Underworld', 14), ('edc-las-vegas', 'San Holo', 15),
    ('edc-las-vegas', 'Seven Lions', 16), ('edc-las-vegas', 'Interplanetary Criminal', 17),
    ('edc-las-vegas', 'Hannah Laing', 18),

    -- Awakenings 2026
    ('awakenings', 'Amelie Lens', 0), ('awakenings', 'Charlotte de Witte', 1),
    ('awakenings', 'Adam Beyer', 2), ('awakenings', 'Joris Voorn', 3),
    ('awakenings', 'Kevin de Vries', 4), ('awakenings', '999999999', 5),
    ('awakenings', 'Adriatique', 6), ('awakenings', 'Freddy K', 7),
    ('awakenings', 'Nina Kraviz', 8), ('awakenings', 'I Hate Models', 9),
    ('awakenings', 'Ben Klock', 10), ('awakenings', 'Len Faki', 11),
    ('awakenings', 'Speedy J', 12), ('awakenings', 'Rødhåd', 13),
    ('awakenings', 'Bart Skils', 14), ('awakenings', 'Cloonee', 15),
    ('awakenings', 'Pan-Pot', 16),

    -- Coachella 2026
    ('coachella', 'Sabrina Carpenter', 0), ('coachella', 'Justin Bieber', 1),
    ('coachella', 'Karol G', 2), ('coachella', 'Anyma', 3),
    ('coachella', 'Disclosure', 4), ('coachella', 'FKA Twigs', 5),
    ('coachella', 'Nine Inch Nails', 6), ('coachella', 'Iggy Pop', 7),
    ('coachella', 'David Byrne', 8), ('coachella', 'Moby', 9),
    ('coachella', 'Devo', 10),

    -- Untold 2026
    ('untold', 'Martin Garrix', 0), ('untold', 'The Chainsmokers', 1),
    ('untold', 'Kygo', 2), ('untold', 'Sebastian Ingrosso', 3),
    ('untold', 'Lost Frequencies', 4), ('untold', 'Steve Aoki', 5),
    ('untold', 'Marshmello', 6), ('untold', 'Afrojack', 7),
    ('untold', 'R3HAB', 8), ('untold', 'Flo Rida', 9),
    ('untold', 'Swae Lee', 10), ('untold', 'Tash Sultana', 11),
    ('untold', 'Carl Cox', 12), ('untold', 'Denzel Curry', 13),
    ('untold', 'Andy C', 14), ('untold', 'Gordo', 15),
    ('untold', 'Shimza', 16), ('untold', 'WhoMadeWho', 17),

    -- Defqon.1 2026
    ('defqon-1', 'D-Sturb', 0), ('defqon-1', 'Brennan Heart', 1),
    ('defqon-1', 'Phuture Noize', 2), ('defqon-1', 'Sefa', 3),
    ('defqon-1', 'Radical Redemption', 4), ('defqon-1', 'Coone', 5),
    ('defqon-1', 'DJ Isaac', 6), ('defqon-1', 'Ran-D', 7),
    ('defqon-1', 'Adaro', 8), ('defqon-1', 'Angerfist', 9),
    ('defqon-1', 'Hysta', 10),

    -- Creamfields 2026
    ('creamfields', 'Calvin Harris', 0), ('creamfields', 'Swedish House Mafia', 1),
    ('creamfields', 'Alesso', 2), ('creamfields', 'Martin Garrix', 3),
    ('creamfields', 'Tiësto', 4), ('creamfields', 'Armin van Buuren', 5),
    ('creamfields', 'Disclosure', 6), ('creamfields', 'Carl Cox', 7),
    ('creamfields', 'Duke Dumont', 8), ('creamfields', 'Dom Dolla', 9),
    ('creamfields', 'FISHER', 10), ('creamfields', 'Gorgon City', 11),
    ('creamfields', 'John Summit', 12), ('creamfields', 'Amelie Lens', 13),
    ('creamfields', 'Sonny Fodera', 14), ('creamfields', 'CamelPhat', 15),
    ('creamfields', 'Andy C', 16), ('creamfields', 'Chris Stussy', 17),
    ('creamfields', 'Kettama', 18), ('creamfields', 'Chloé Caillet', 19),

    -- Sziget 2026
    ('sziget', 'Florence + the Machine', 0), ('sziget', 'Lewis Capaldi', 1),
    ('sziget', 'Sombr', 2), ('sziget', 'Twenty One Pilots', 3),
    ('sziget', 'Ashnikko', 4), ('sziget', 'Biffy Clyro', 5),
    ('sziget', 'Dom Dolla', 6), ('sziget', 'Peggy Gou', 7),
    ('sziget', 'Underworld', 8), ('sziget', 'Skepta', 9),
    ('sziget', 'Jorja Smith', 10), ('sziget', 'Sigrid', 11),
    ('sziget', 'Soulwax', 12),

    -- EXIT 2026
    ('exit', 'The Prodigy', 0), ('exit', 'Gorillaz', 1),
    ('exit', 'Joris Voorn', 2), ('exit', 'Nina Kraviz', 3),

    -- Parookaville 2026
    ('parookaville', 'Armin van Buuren', 0), ('parookaville', 'Charlotte de Witte', 1),
    ('parookaville', 'The Chainsmokers', 2), ('parookaville', 'Timmy Trumpet', 3),
    ('parookaville', 'Hardwell', 4), ('parookaville', 'W&W', 5),
    ('parookaville', 'Sonny Fodera', 6), ('parookaville', 'Don Diablo', 7),
    ('parookaville', 'Steve Aoki', 8), ('parookaville', 'Bovski', 9),
    ('parookaville', 'Cassian', 10), ('parookaville', 'Joris Voorn', 11)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = l.slug
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

-- Mark these editions as having a published lineup.
update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id
  and e.year = 2026
  and f.slug in (
    'tomorrowland', 'ultra-miami', 'edc-las-vegas', 'awakenings', 'coachella',
    'untold', 'defqon-1', 'creamfields', 'sziget', 'exit', 'parookaville'
  );
