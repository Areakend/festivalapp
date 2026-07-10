-- ============================================================
-- Eskape Festival 2026 — new festival. Hardstyle/hardcore/rawstyle
-- event in Montilly-sur-Noireau, Normandy, France (July 31 - Aug 2,
-- 2026). Lineup transcribed from the official day-by-day timetable
-- (3 stages: MADLAND, Le Terrier, No Time Stage).
-- ============================================================

insert into public.festivals (name, slug, country, city) values
  ('Eskape Festival', 'eskape', 'FR', 'Montilly-sur-Noireau')
on conflict (slug) do nothing;

insert into public.festival_editions (festival_id, year, start_date, end_date)
select f.id, 2026, '2026-07-31'::date, '2026-08-02'::date
from public.festivals f
where f.slug = 'eskape'
on conflict (festival_id, year) do update
  set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.artists (name)
select v.name
from (values
  ('Offroad'), ('Tromatyk'), ('Hortense de Beauharnais'), ('25ème Heure'), ('Teksa'),
  ('Byorn'), ('William Luck'), ('Omaks B2B Protokseed'), ('I Hate Models'),
  ('Willy The Kick'), ('Darktek'), ('R3trix'), ('Mr Bassmeister'), ('Remzcore & M''Dezoen'),
  ('Mish'), ('Anime'), ('Radical Redemption'), ('Adrenalize'), ('Sub Zero Project'),
  ('D''Head Shoot'), ('Unicorn On K'), ('Equal2'), ('Reflexx'), ('N-XD'), ('Cosy Nghtmre'),
  ('Yoshiko'), ('Lekkerfaces'), ('STV'), ('Dr.Donk'),
  ('Impact'), ('Maës'), ('Rouge'), ('Prax'), ('JKLL present «Arkaïné»'), ('A5KM'),
  ('Eczodia'), ('AnD'), ('Mad Dog'), ('Rebekah'),
  ('Peak''O'), ('Fury'), ('L''Etrange M.Redan'), ('Anamorphic'), ('D-Frek'), ('Rdé'),
  ('Neko B2B Goblin Grave'), ('Angerfist'), ('D-Fence'), ('Maissouille B2B Billx'),
  ('Marty Sans Plomb'), ('Jean-Marc La Barre'), ('Bardix Le Gaulois'), ('Le Son Vert'),
  ('Roland Cristal'), ('Klakmatrak & Lolalita'),
  ('D-Code'), ('DJ Schnake'), ('KRL MX'), ('Matrakk'), ('Pawlowski'), ('Joanna Coelho'),
  ('Novah'), ('Samuel Moriero'), ('Moonkyz'),
  ('Quentin Mazuel'), ('Krykor'), ('Damien RK'), ('Lalou'), ('Evil Activities'),
  ('Hard Driver'), ('Dual Damage'), ('Coone'), ('D-Block & S-te-Fan'),
  ('Suburbass'), ('Töxyblue'), ('Psiko'), ('Art of Fighters'), ('Rob Gee'), ('Ophidian'),
  ('F.Noize'),
  ('Tha Watcher')
) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values
    ('Offroad', 0), ('Tromatyk', 1), ('Hortense de Beauharnais', 2), ('25ème Heure', 3),
    ('Teksa', 4), ('Byorn', 5), ('William Luck', 6), ('Omaks B2B Protokseed', 7),
    ('I Hate Models', 8),
    ('Willy The Kick', 9), ('Darktek', 10), ('R3trix', 11), ('Mr Bassmeister', 12),
    ('Remzcore & M''Dezoen', 13), ('Mish', 14), ('Anime', 15), ('Radical Redemption', 16),
    ('Adrenalize', 17), ('Sub Zero Project', 18),
    ('D''Head Shoot', 19), ('Unicorn On K', 20), ('Equal2', 21), ('Reflexx', 22),
    ('N-XD', 23), ('Cosy Nghtmre', 24), ('Yoshiko', 25), ('Lekkerfaces', 26), ('STV', 27),
    ('Dr.Donk', 28),
    ('Impact', 29), ('Maës', 30), ('Rouge', 31), ('Prax', 32),
    ('JKLL present «Arkaïné»', 33), ('A5KM', 34), ('Eczodia', 35), ('AnD', 36),
    ('Mad Dog', 37), ('Rebekah', 38),
    ('Peak''O', 39), ('Fury', 40), ('L''Etrange M.Redan', 41), ('Anamorphic', 42),
    ('D-Frek', 43), ('Rdé', 44), ('Neko B2B Goblin Grave', 45), ('Angerfist', 46),
    ('D-Fence', 47), ('Maissouille B2B Billx', 48),
    ('Marty Sans Plomb', 49), ('Jean-Marc La Barre', 50), ('Bardix Le Gaulois', 51),
    ('Le Son Vert', 52), ('Roland Cristal', 53), ('Klakmatrak & Lolalita', 54),
    ('D-Code', 55), ('DJ Schnake', 56), ('KRL MX', 57), ('Matrakk', 58), ('Pawlowski', 59),
    ('Joanna Coelho', 60), ('Novah', 61), ('Samuel Moriero', 62), ('Moonkyz', 63),
    ('Quentin Mazuel', 64), ('Krykor', 65), ('Damien RK', 66), ('Lalou', 67),
    ('Evil Activities', 68), ('Hard Driver', 69), ('Dual Damage', 70), ('Coone', 71),
    ('D-Block & S-te-Fan', 72),
    ('Suburbass', 73), ('Töxyblue', 74), ('Psiko', 75), ('Art of Fighters', 76),
    ('Rob Gee', 77), ('Ophidian', 78), ('F.Noize', 79),
    ('Tha Watcher', 80)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'eskape'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'eskape' and e.year = 2026;
