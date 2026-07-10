-- ============================================================
-- Chauffer dans la Noirceur 2026 — new festival. 34e édition,
-- festival éco-citoyen, Plage de Montmartin-sur-Mer (Manche, France),
-- 10-12 juillet 2026. Lineup transcribed from the official poster.
-- ============================================================

insert into public.festivals (name, slug, country, city) values
  ('Chauffer dans la Noirceur', 'chauffer-dans-la-noirceur', 'FR', 'Montmartin-sur-Mer')
on conflict (slug) do nothing;

insert into public.festival_editions (festival_id, year, start_date, end_date)
select f.id, 2026, '2026-07-10'::date, '2026-07-12'::date
from public.festivals f
where f.slug = 'chauffer-dans-la-noirceur'
on conflict (festival_id, year) do update
  set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.artists (name)
select v.name
from (values
  ('Sleaford Mods'), ('Ascendant Vierge'), ('Fat Dog'), ('Lila Iké'), ('Yuston XIII'),
  ('Zélie'), ('Celkilt'), ('Zentone'), ('Marlon Magnée'), ('Here And Everywhere'),
  ('Ukandanz'), ('Mathilde Fernandez'), ('La Jungle'), ('Nathalie Froehlich'), ('Photons'),
  ('Blu Samu'), ('Technobrass'), ('Zerzura'), ('Knives'), ('Issara'),
  ('Felhur X Andro'), ('Changeline'), ('Shiran & Bakal'), ('Silver Gore'), ('Travo'),
  ('Grand Bruit'), ('Pussy Miel'), ('EV'), ('Oria Oskana'), ('Storm'),
  ('Lolomis'), ('Brôgeal Y'), ('Meryl Streek'), ('Luneris'), ('Joube'),
  ('Jasmine Not Jafar'), ('Aurore'), ('Christine'), ('Hada'), ('Sopa Boba'),
  ('Split'), ('La Swaag'), ('La Décharge'), ('Dead Bob'), ('Shaggirrra & The Queens'),
  ('Cie Les Déclenchés')
) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values
    ('Sleaford Mods', 0), ('Ascendant Vierge', 1), ('Fat Dog', 2), ('Lila Iké', 3),
    ('Yuston XIII', 4), ('Zélie', 5), ('Celkilt', 6), ('Zentone', 7),
    ('Marlon Magnée', 8), ('Here And Everywhere', 9),
    ('Ukandanz', 10), ('Mathilde Fernandez', 11), ('La Jungle', 12),
    ('Nathalie Froehlich', 13), ('Photons', 14), ('Blu Samu', 15), ('Technobrass', 16),
    ('Zerzura', 17), ('Knives', 18), ('Issara', 19), ('Felhur X Andro', 20), ('Changeline', 21),
    ('Shiran & Bakal', 22), ('Silver Gore', 23), ('Travo', 24), ('Grand Bruit', 25),
    ('Pussy Miel', 26), ('EV', 27),
    ('Oria Oskana', 28), ('Storm', 29), ('Lolomis', 30), ('Brôgeal Y', 31),
    ('Meryl Streek', 32), ('Luneris', 33), ('Joube', 34),
    ('Jasmine Not Jafar', 35), ('Aurore', 36), ('Christine', 37), ('Hada', 38),
    ('Sopa Boba', 39), ('Split', 40),
    ('La Swaag', 41), ('La Décharge', 42), ('Dead Bob', 43), ('Shaggirrra & The Queens', 44),
    ('Cie Les Déclenchés', 45)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'chauffer-dans-la-noirceur'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'chauffer-dans-la-noirceur' and e.year = 2026;
