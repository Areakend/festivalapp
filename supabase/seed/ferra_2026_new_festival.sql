-- New festival: FERRA 2026, first edition (21-22 Aug 2026, Weltkulturerbe
-- Völklinger Hütte, Saarland, Germany). Hard techno/bounce/trance offshoot
-- of Hive Festival, organized by Permanent Entertainment. Verified via
-- official site (ferra-festival.de) and press coverage before adding.
-- Lineup transcribed from the festival's own Instagram poster; B2B sets
-- kept as a single combined artist entry ("Name1 x Name2"), same
-- convention as the rest of this app's lineup seed data.

insert into festivals (name, slug, description, country, city, venue, genres, official_website, first_year)
values (
  'FERRA', 'ferra',
  'A hard techno, bounce and trance festival by Permanent Entertainment in cooperation with Hive Festival, held across five stages at the Völklingen Ironworks UNESCO World Heritage site.',
  'DE', 'Völklingen', 'Weltkulturerbe Völklinger Hütte',
  array['techno','hard techno','trance'],
  'https://www.ferra-festival.de/', 2026
)
on conflict (slug) do nothing;

insert into festival_editions (festival_id, year, start_date, end_date)
select f.id, 2026, '2026-08-21', '2026-08-22'
from festivals f where f.slug = 'ferra'
on conflict (festival_id, year) do nothing;

insert into public.artists (name)
select v.name
from (values
  ('2Hot2Play'), ('999999999'), ('A.N.I.'), ('Alarico x Ben Klock'), ('Alignment'), ('Ally'),
  ('Alycia Bezgo x Trancemaster Krause'), ('Azyr'), ('Baugruppe90'), ('Ben Techy'),
  ('Bøęry x Santøs'), ('Callush'), ('Charlie Sparks'), ('Clara Cuvé'), ('Cleopard2000'),
  ('Dasstudach'), ('David Löhlein'), ('Davyboi'), ('Dax J x SHDW'), ('Dexphase'),
  ('DJ Cringey'), ('DJ Dreckisch'), ('Elmefti'), ('Frederic. x Mika Heggemann'),
  ('Freddy K x Yanamaste'), ('Giø x Zwilling.'), ('Hannah Laing'), ('IGDA'), ('In Verruf'),
  ('Jazzy x Jowi'), ('Jovynn'), ('Kalte Liebe'), ('Karah'), ('Kistenbrügger'), ('Klofama'),
  ('Kobosil'), ('Kruelty'), ('Natte Visstick'), ('Neek'), ('Nicolas Julian'), ('Nico Moreno'),
  ('Nikolina'), ('NotMyType'), ('Novah'), ('Obscure Shape'), ('Omaks'), ('Onlynumbers'),
  ('Ornella'), ('Paraçek'), ('Prada2000'), ('Restricted'), ('Saltysis'), ('Schrotthagen'),
  ('Secret Act'), ('Somewhen'), ('Tauceti'), ('The Lady Machine'), ('Toxic Machinery'),
  ('Überkikz'), ('USH'), ('Vendex'), ('Vieze Asbak'), ('Winson')
) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values
    ('2Hot2Play', 0), ('999999999', 1), ('A.N.I.', 2), ('Alarico x Ben Klock', 3),
    ('Alignment', 4), ('Ally', 5), ('Alycia Bezgo x Trancemaster Krause', 6), ('Azyr', 7),
    ('Baugruppe90', 8), ('Ben Techy', 9), ('Bøęry x Santøs', 10), ('Callush', 11),
    ('Charlie Sparks', 12), ('Clara Cuvé', 13), ('Cleopard2000', 14), ('Dasstudach', 15),
    ('David Löhlein', 16), ('Davyboi', 17), ('Dax J x SHDW', 18), ('Dexphase', 19),
    ('DJ Cringey', 20), ('DJ Dreckisch', 21), ('Elmefti', 22), ('Frederic. x Mika Heggemann', 23),
    ('Freddy K x Yanamaste', 24), ('Giø x Zwilling.', 25), ('Hannah Laing', 26), ('IGDA', 27),
    ('In Verruf', 28), ('Jazzy x Jowi', 29), ('Jovynn', 30), ('Kalte Liebe', 31), ('Karah', 32),
    ('Kistenbrügger', 33), ('Klofama', 34), ('Kobosil', 35), ('Kruelty', 36),
    ('Natte Visstick', 37), ('Neek', 38), ('Nicolas Julian', 39), ('Nico Moreno', 40),
    ('Nikolina', 41), ('NotMyType', 42), ('Novah', 43), ('Obscure Shape', 44), ('Omaks', 45),
    ('Onlynumbers', 46), ('Ornella', 47), ('Paraçek', 48), ('Prada2000', 49),
    ('Restricted', 50), ('Saltysis', 51), ('Schrotthagen', 52), ('Secret Act', 53),
    ('Somewhen', 54), ('Tauceti', 55), ('The Lady Machine', 56), ('Toxic Machinery', 57),
    ('Überkikz', 58), ('USH', 59), ('Vendex', 60), ('Vieze Asbak', 61), ('Winson', 62)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'ferra'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'ferra' and e.year = 2026;
