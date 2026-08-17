-- ============================================================
-- Les Plages Électroniques (Cannes) had no 2026 edition on file at
-- all despite the 2026 edition (Aug 7-9, its 20th-anniversary edition)
-- having already happened by the time this was researched
-- (2026-08-16) -- confirmed via the official site
-- plages-electroniques.com and press coverage. Full lineup added too
-- (DJ Snake, Amélie Lens, Martin Garrix, Marshmello, PLK and more),
-- B2B sets split into their two individual artists. 2027 dates are
-- not announced yet as of this research.
--
-- Note: 'plage-electro' (a stale duplicate of this festival, already
-- merged away in production by migration
-- 20260706100000_merge_duplicate_plage_electro.sql) is deliberately
-- left untouched here, same as every prior pass this session.
-- ============================================================

insert into public.festival_editions (festival_id, year, start_date, end_date)
select id, 2026, '2026-08-07', '2026-08-09'
from public.festivals where slug = 'les-plages-electroniques'
on conflict (festival_id, year) do update
  set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.artists (name)
select v.name
from (values
  ('Martin Garrix'), ('Mosimann'), ('Nico Moreno'), ('Candice'), ('DJUDAH'),
  ('Global Industrial Culture'), ('Lachica'), ('Leblanc'), ('Lessss'), ('Oguz'), ('Paloma'),
  ('Rivo'), ('Roüge'), ('Roxie'), ('Sonny Fodera'), ('Venga'), ('Yasmin Regisford'),
  ('Amélie Lens'), ('Marshmello'), ('PLK'), ('Vladimir Cauchemar'), ('Ben Sterling'), ('Emma B'),
  ('Interplanetary Criminal'), ('Lilya Mandre'), ('Liv Del Estal'), ('Lovi'), ('Malugi'),
  ('Mamba Skar'), ('Maudux'), ('Nfrtiti'), ('Ramyen'), ('Umbree'), ('Urumi'),
  ('DJ Snake'), ('Anetha'), ('Patrick Mason'), ('Salvatore Ganacci'), ('Dany Neville'),
  ('Alignment'), ('Baron'), ('Dorian Craft'), ('Boticka'), ('Clara Cuvé'), ('Deron'),
  ('Hortense de Beauharnais'), ('Kimberlaid'), ('Lüna'), ('Marsey'), ('Moblack'), ('Salomé Le Chat')
) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values
    ('Martin Garrix', 0), ('Mosimann', 1), ('Nico Moreno', 2), ('Candice', 3), ('DJUDAH', 4),
    ('Global Industrial Culture', 5), ('Lachica', 6), ('Leblanc', 7), ('Lessss', 8), ('Oguz', 9),
    ('Paloma', 10), ('Rivo', 11), ('Roüge', 12), ('Roxie', 13), ('Sonny Fodera', 14),
    ('Venga', 15), ('Yasmin Regisford', 16),
    ('Amélie Lens', 17), ('Marshmello', 18), ('PLK', 19), ('Vladimir Cauchemar', 20),
    ('Ben Sterling', 21), ('Emma B', 22), ('Interplanetary Criminal', 23), ('Lilya Mandre', 24),
    ('Liv Del Estal', 25), ('Lovi', 26), ('Malugi', 27), ('Mamba Skar', 28), ('Maudux', 29),
    ('Nfrtiti', 30), ('Ramyen', 31), ('Umbree', 32), ('Urumi', 33),
    ('DJ Snake', 34), ('Anetha', 35), ('Patrick Mason', 36), ('Salvatore Ganacci', 37),
    ('Dany Neville', 38), ('Alignment', 39), ('Baron', 40), ('Dorian Craft', 41),
    ('Boticka', 42), ('Clara Cuvé', 43), ('Deron', 44), ('Hortense de Beauharnais', 45),
    ('Kimberlaid', 46), ('Lüna', 47), ('Marsey', 48), ('Moblack', 49), ('Salomé Le Chat', 50)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festival_editions e on e.festival_id = (select id from public.festivals where slug = 'les-plages-electroniques') and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'les-plages-electroniques' and e.year = 2026;
