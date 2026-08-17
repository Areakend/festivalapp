-- POSITIV (Théâtre Antique d'Orange, France) was stuck at 9 artists for its
-- 2026 edition (Aug 14-16) — expanded to 16, cross-checked across the
-- official site, Shotgun (its official ticketing partner) and several
-- independent listing sites. This is a small, venue-capacity-limited
-- festival by design (a seated Roman amphitheatre), not an artifact of
-- incomplete research — the agent explicitly stopped rather than pad the
-- list to hit an arbitrary count.
--
-- Also adds the 2027 edition (Aug 13-15), already on sale per the official
-- site (positivfestival.fr).

insert into public.artists (name)
select v.name
from (values
  ('Boris Brejcha'), ('Charlotte de Witte'), ('FISHER'), ('Marlon Hoffstadt'), ('Novah'),
  ('Biianco'), ('Venga'), ('Carla Schmitt'), ('Nicolas Cuer'), ('Gordo'), ('DAMN LOW'),
  ('FLKN'), ('Nusha'), ('Gary Beck'), ('Charlotte Newman'), ('Marten Lou')
) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values
    ('Boris Brejcha', 0), ('Charlotte de Witte', 1), ('FISHER', 2), ('Marlon Hoffstadt', 3),
    ('Novah', 4), ('Biianco', 5), ('Venga', 6), ('Carla Schmitt', 7), ('Nicolas Cuer', 8),
    ('Gordo', 9), ('DAMN LOW', 10), ('FLKN', 11), ('Nusha', 12), ('Gary Beck', 13),
    ('Charlotte Newman', 14), ('Marten Lou', 15)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'positiv'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'positiv' and e.year = 2026;

insert into festival_editions (festival_id, year, start_date, end_date)
select f.id, 2027, '2027-08-13', '2027-08-15'
from festivals f where f.slug = 'positiv'
on conflict (festival_id, year) do nothing;
