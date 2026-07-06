-- ============================================================
-- User-requested festival additions, with 2026 dates + lineups.
-- Sourced from official festival sites, Songkick, Sortiraparis,
-- and French music press. Idempotent: upserts on slug / (festival_id,
-- year) / (edition_id, artist_id) — safe to re-run.
-- ============================================================

insert into public.festivals (name, slug, country) values
  ('Festival Beauregard', 'beauregard', 'FR'),
  ('Hellfest', 'hellfest', 'FR'),
  ('Les Ardentes', 'les-ardentes', 'BE')
on conflict (slug) do nothing;

insert into public.festival_editions (festival_id, year, start_date, end_date)
select f.id, 2026, v.start_date::date, v.end_date::date
from (values
  ('beauregard', '2026-07-01', '2026-07-05'),
  ('hellfest', '2026-06-18', '2026-06-21'),
  ('les-ardentes', '2026-07-02', '2026-07-05')
) as v(slug, start_date, end_date)
join public.festivals f on f.slug = v.slug
on conflict (festival_id, year) do update
  set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.artists (name)
select v.name
from (values
  ('Aya Nakamura'), ('Macklemore'), ('Bob Sinclar'), ('Orelsan'), ('Pulp'),
  ('La Mano 1.9'), ('Thylacine'), ('Cassius'), ('Girls In Hawaii'), ('Theodora'),
  ('Feu! Chatterton'), ('The Hives'), ('Gaëtan Roussel'), ('Rilès'), ('Mosimann'),
  ('Dropkick Murphys'), ('Charlotte Cardin'), ('Franz Ferdinand'), ('Royel Otis'),
  ('Agnes Obel'), ('Pixies'), ('Armin van Buuren'), ('Vanessa Paradis'), ('Gaël Faye'),
  ('Disiz'), ('Kevin Morby'),
  ('Bring Me the Horizon'), ('Iron Maiden'), ('Limp Bizkit'), ('The Offspring'),
  ('Deep Purple'), ('Alice Cooper'), ('Papa Roach'), ('Breaking Benjamin'),
  ('Sabaton'), ('Opeth'), ('Helloween'), ('Sepultura'), ('The Dillinger Escape Plan'),
  ('Mastodon'), ('Blood Incantation'), ('Megadeth'), ('Anthrax'), ('Behemoth'),
  ('A Perfect Circle'), ('Bad Omens'), ('Architects'), ('Rise Against'), ('Three Days Grace'),
  ('Playboi Carti'), ('Black Eyed Peas'), ('Future'), ('Charlotte de Witte'),
  ('Homixide Gang'), ('Destroy Lonely'), ('Booba'), ('Djadja & Dinaz'),
  ('Bigflo & Oli'), ('PLK'), ('La Fouine'), ('Rohff'), ('Sinik'), ('Sniper'),
  ('Vald'), ('Lost Frequencies'), ('Naza'), ('Lujipeka'), ('Nico Moreno'),
  ('I Hate Models'), ('Malaa')
) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(slug, artist_name, order_index) as (
  values
    -- Festival Beauregard 2026
    ('beauregard', 'Aya Nakamura', 0), ('beauregard', 'Macklemore', 1),
    ('beauregard', 'Bob Sinclar', 2), ('beauregard', 'Orelsan', 3),
    ('beauregard', 'Pulp', 4), ('beauregard', 'La Mano 1.9', 5),
    ('beauregard', 'Thylacine', 6), ('beauregard', 'Cassius', 7),
    ('beauregard', 'Girls In Hawaii', 8), ('beauregard', 'Theodora', 9),
    ('beauregard', 'Feu! Chatterton', 10), ('beauregard', 'The Hives', 11),
    ('beauregard', 'Gaëtan Roussel', 12), ('beauregard', 'Rilès', 13),
    ('beauregard', 'Mosimann', 14), ('beauregard', 'Dropkick Murphys', 15),
    ('beauregard', 'Charlotte Cardin', 16), ('beauregard', 'Franz Ferdinand', 17),
    ('beauregard', 'Royel Otis', 18), ('beauregard', 'Agnes Obel', 19),
    ('beauregard', 'Pixies', 20), ('beauregard', 'Armin van Buuren', 21),
    ('beauregard', 'Vanessa Paradis', 22), ('beauregard', 'Gaël Faye', 23),
    ('beauregard', 'Disiz', 24), ('beauregard', 'Kevin Morby', 25),

    -- Hellfest 2026
    ('hellfest', 'Bring Me the Horizon', 0), ('hellfest', 'Iron Maiden', 1),
    ('hellfest', 'Limp Bizkit', 2), ('hellfest', 'The Offspring', 3),
    ('hellfest', 'Deep Purple', 4), ('hellfest', 'Alice Cooper', 5),
    ('hellfest', 'Papa Roach', 6), ('hellfest', 'Breaking Benjamin', 7),
    ('hellfest', 'Sabaton', 8), ('hellfest', 'Opeth', 9),
    ('hellfest', 'Helloween', 10), ('hellfest', 'Sepultura', 11),
    ('hellfest', 'The Dillinger Escape Plan', 12), ('hellfest', 'Mastodon', 13),
    ('hellfest', 'Blood Incantation', 14), ('hellfest', 'Megadeth', 15),
    ('hellfest', 'Anthrax', 16), ('hellfest', 'Behemoth', 17),
    ('hellfest', 'A Perfect Circle', 18), ('hellfest', 'The Hives', 19),
    ('hellfest', 'Bad Omens', 20), ('hellfest', 'Architects', 21),
    ('hellfest', 'Rise Against', 22), ('hellfest', 'Three Days Grace', 23),

    -- Les Ardentes 2026
    ('les-ardentes', 'Playboi Carti', 0), ('les-ardentes', 'Black Eyed Peas', 1),
    ('les-ardentes', 'Future', 2), ('les-ardentes', 'Charlotte de Witte', 3),
    ('les-ardentes', 'Aya Nakamura', 4), ('les-ardentes', 'Homixide Gang', 5),
    ('les-ardentes', 'Destroy Lonely', 6), ('les-ardentes', 'Booba', 7),
    ('les-ardentes', 'Djadja & Dinaz', 8), ('les-ardentes', 'Bigflo & Oli', 9),
    ('les-ardentes', 'PLK', 10), ('les-ardentes', 'La Fouine', 11),
    ('les-ardentes', 'Rohff', 12), ('les-ardentes', 'Sinik', 13),
    ('les-ardentes', 'Sniper', 14), ('les-ardentes', 'Vald', 15),
    ('les-ardentes', 'Lost Frequencies', 16), ('les-ardentes', 'Naza', 17),
    ('les-ardentes', 'Theodora', 18), ('les-ardentes', 'Rilès', 19),
    ('les-ardentes', 'Lujipeka', 20), ('les-ardentes', 'Nico Moreno', 21),
    ('les-ardentes', 'I Hate Models', 22), ('les-ardentes', 'Malaa', 23)
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
  and f.slug in ('beauregard', 'hellfest', 'les-ardentes');
