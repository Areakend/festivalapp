-- ============================================================
-- Les Déferlantes 2026 — dates + lineup from the official poster
-- (Le Barcarès, France, 11-13 July 2026).
-- ============================================================

insert into public.festival_editions (festival_id, year, start_date, end_date)
select f.id, 2026, '2026-07-11'::date, '2026-07-13'::date
from public.festivals f
where f.slug = 'les-deferlantes'
on conflict (festival_id, year) do update
  set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.artists (name)
select v.name
from (values
  ('Afrojack'), ('Armin van Buuren'), ('Aya Nakamura'), ('Damso'), ('GIMS'),
  ('Martin Garrix'), ('Matt Pokora'), ('Niska'), ('PLK'), ('Sean Paul'),
  ('Theodora'), ('Timmy Trumpet'), ('Vald'), ('Vladimir Cauchemar'), ('Todiefor'),
  ('Adèle Castillon'), ('Eve La Marka'), ('Kungs'), ('L2B'), ('Magic System'),
  ('Miki'), ('Mosimann'),
  ('Cyril'), ('Dakeez'), ('Danyl'), ('Folie''s'), ('Hypaton'), ('Jey Brownie'),
  ('Luca Testa'), ('Morgan Nagoya'), ('Paloma'), ('Petit Biscuit'),
  ('Secte Sound System'), ('VLTN*'), ('William'), ('Zed')
) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values
    ('Afrojack', 0), ('Armin van Buuren', 1), ('Aya Nakamura', 2), ('Damso', 3),
    ('GIMS', 4), ('Martin Garrix', 5), ('Matt Pokora', 6), ('Niska', 7),
    ('PLK', 8), ('Sean Paul', 9), ('Theodora', 10), ('Timmy Trumpet', 11),
    ('Vald', 12), ('Vladimir Cauchemar', 13), ('Todiefor', 14),
    ('Adèle Castillon', 15), ('Eve La Marka', 16), ('Kungs', 17), ('L2B', 18),
    ('Magic System', 19), ('Miki', 20), ('Mosimann', 21),
    ('Cyril', 22), ('Dakeez', 23), ('Danyl', 24), ('Folie''s', 25),
    ('Hypaton', 26), ('Jey Brownie', 27), ('Luca Testa', 28), ('Morgan Nagoya', 29),
    ('Paloma', 30), ('Petit Biscuit', 31), ('Secte Sound System', 32),
    ('VLTN*', 33), ('William', 34), ('Zed', 35)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'les-deferlantes'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'les-deferlantes' and e.year = 2026;
