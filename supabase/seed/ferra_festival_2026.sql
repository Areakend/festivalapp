-- ============================================================
-- FERRA Festival — brand new, first edition, 21-22 Aug 2026 at the
-- UNESCO World Heritage Völklinger Hütte (Völklingen, Germany).
-- Organized by Permanent Entertainment in cooperation with Hive
-- Festival. Confirmed via official site (ferra-festival.de) and press
-- coverage (Rheinpfalz, festivalsindeutschland.de): "dreitägiges"
-- three-day branding (21-23 Aug) but main festival activity on the
-- 21st-22nd, matching the official lineup poster's own printed dates
-- — used here. Lineup (67 DJs across 5 stages, hard techno/bounce/
-- trance) transcribed from the official lineup poster; B2B sets split
-- into their two individual artists so each still matches an
-- individual artist follow.
-- ============================================================

insert into public.festivals (name, slug, description, country, city, venue, genres, official_website)
values (
  'FERRA',
  'ferra',
  'A new hard techno festival transforming the UNESCO World Heritage Völklinger Hütte ironworks into one of Germany''s most extraordinary techno locations — five stages, laser installations and industrial-scale sound.',
  'DE',
  'Völklingen',
  'Weltkulturerbe Völklinger Hütte',
  array['techno','hard techno','bounce','trance'],
  'https://www.ferra-festival.de/'
)
on conflict (slug) do nothing;

insert into public.festival_editions (festival_id, year, start_date, end_date)
select id, 2026, '2026-08-21', '2026-08-22'
from public.festivals where slug = 'ferra'
on conflict (festival_id, year) do update
  set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.artists (name)
select v.name
from (values
  ('2hot2play'), ('999999999'), ('A.N.I.'), ('Alarico'), ('Ben Klock'), ('Alignment'), ('Ally'),
  ('Alycia Bezgo'), ('Trancemaster Krause'), ('Azyr'), ('Baugruppe90'), ('Ben Techy'), ('Bøęry'),
  ('Santøs'), ('Callush'), ('Charlie Sparks'), ('Clara Cuvé'), ('Cleopard2000'), ('Dasstudach'),
  ('David Löhlein'), ('Davyboi'), ('Dax J'), ('SHDW'), ('Dexphase'), ('DJ Cringey'), ('DJ Dreckisch'),
  ('Elmefti'), ('Frederic.'), ('Mika Heggemann'), ('Freddy K'), ('Yanamaste'), ('Giø'), ('Zwilling.'),
  ('Hannah Laing'), ('In Verruf'), ('Jazzy'), ('Jowi'), ('Jovynn'), ('Kalte Liebe'), ('Karah'),
  ('Kistenbrügger'), ('Klofama'), ('Kobosil'), ('Kruelty'), ('Natte Visstick'), ('Neek'),
  ('Nicolas Julian'), ('Nico Moreno'), ('Nikolina'), ('Notmytype'), ('Novah'), ('Obscure Shape'),
  ('Omaks'), ('Onlynumbers'), ('Ornella'), ('Paraçek'), ('Prada2000'), ('Restricted'), ('Saltysis'),
  ('Schrotthagen'), ('Secret Act'), ('Somewhen'), ('Tauceti'), ('The Lady Machine'),
  ('Toxic Machinery'), ('Überkikz'), ('Ush'), ('Vendex'), ('Vieze Asbak'), ('Winson')
) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values
    ('2hot2play', 0), ('999999999', 1), ('A.N.I.', 2), ('Alarico', 3), ('Ben Klock', 4),
    ('Alignment', 5), ('Ally', 6), ('Alycia Bezgo', 7), ('Trancemaster Krause', 8), ('Azyr', 9),
    ('Baugruppe90', 10), ('Ben Techy', 11), ('Bøęry', 12), ('Santøs', 13), ('Callush', 14),
    ('Charlie Sparks', 15), ('Clara Cuvé', 16), ('Cleopard2000', 17), ('Dasstudach', 18),
    ('David Löhlein', 19), ('Davyboi', 20), ('Dax J', 21), ('SHDW', 22), ('Dexphase', 23),
    ('DJ Cringey', 24), ('DJ Dreckisch', 25), ('Elmefti', 26), ('Frederic.', 27),
    ('Mika Heggemann', 28), ('Freddy K', 29), ('Yanamaste', 30), ('Giø', 31), ('Zwilling.', 32),
    ('Hannah Laing', 33), ('In Verruf', 34), ('Jazzy', 35), ('Jowi', 36), ('Jovynn', 37),
    ('Kalte Liebe', 38), ('Karah', 39), ('Kistenbrügger', 40), ('Klofama', 41), ('Kobosil', 42),
    ('Kruelty', 43), ('Natte Visstick', 44), ('Neek', 45), ('Nicolas Julian', 46),
    ('Nico Moreno', 47), ('Nikolina', 48), ('Notmytype', 49), ('Novah', 50), ('Obscure Shape', 51),
    ('Omaks', 52), ('Onlynumbers', 53), ('Ornella', 54), ('Paraçek', 55), ('Prada2000', 56),
    ('Restricted', 57), ('Saltysis', 58), ('Schrotthagen', 59), ('Secret Act', 60),
    ('Somewhen', 61), ('Tauceti', 62), ('The Lady Machine', 63), ('Toxic Machinery', 64),
    ('Überkikz', 65), ('Ush', 66), ('Vendex', 67), ('Vieze Asbak', 68), ('Winson', 69)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festival_editions e on e.festival_id = (select id from public.festivals where slug = 'ferra') and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'ferra' and e.year = 2026;
