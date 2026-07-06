-- ============================================================
-- Lot 3 of the festival-data audit: the 43 festivals that had no
-- festival_editions row at all (no year/dates/lineup).
--
-- Researched all 43. 30 have verifiable real 2026 dates, added below
-- (a few — Solidays, Sonus — were officially scheduled and then
-- cancelled shortly before/during the event; the originally
-- announced dates are kept as the historical record, same treatment
-- as Defqon.1 in the Lot 1 PR). 5 of those also had confirmed partial
-- lineups surface during date research, added as a bonus.
--
-- 8 festivals are deliberately left untouched: no reliable 2026 date
-- could be found (lmf, luxembourg-open-air, oasis, scream-or-dance,
-- together, unseen, valhalla, vh1-supersonic) — several may be
-- discontinued or simply haven't announced yet.
--
-- glastonbury, edc-china and neversea are correctly excluded already
-- (fallow year / cancelled / postponed to 2027 per existing seed
-- comments) and remain untouched.
-- ============================================================

insert into public.artists (name)
select v.name
from (values
  ('Kungs'), ('Adam Beyer'), ('Benny Benassi'), ('Cascada'), ('Cerrone'),
  ('Miss Monique'), ('Franglish'), ('Bob Sinclar'), ('Kavinsky'),
  ('Petit Biscuit'), ('Joachim Garraud'), ('Macklemore'), ('Feu! Chatterton'),
  ('Mosimann'), ('PLK'), ('Niska'), ('Gims'), ('Helena'), ('Christophe Maé'),
  ('Aya Nakamura'), ('Sean Paul'), ('Martin Garrix'), ('Armin van Buuren'),
  ('Damso'), ('Matt Pokora'), ('Afrojack'), ('Magic System'), ('Theodora'),
  ('Orelsan'), ('Zara Larsson'), ('Bigflo & Oli'), ('Major Lazer'), ('Vald'),
  ('Gazo')
) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

insert into public.festival_editions (festival_id, year, start_date, end_date)
select f.id, 2026, v.start_date::date, v.end_date::date
from (values
  ('amsterdam-dance-event', '2026-10-21', '2026-10-25'),
  ('brunch-electronik', '2026-08-07', '2026-08-08'),
  ('cercle-music-festival', '2026-05-22', '2026-05-24'),
  ('creamfields-hong-kong', '2026-04-01', '2026-04-02'),
  ('decibel-open-air', '2026-09-04', '2026-09-06'),
  ('delta-festival', '2026-07-23', '2026-07-26'),
  ('dream-nation', '2026-10-30', '2026-10-31'),
  ('dream-village', '2026-09-14', '2026-09-14'),
  ('dreamfields', '2026-07-11', '2026-07-12'),
  ('echelon-festival', '2026-08-14', '2026-08-15'),
  ('elektric-park', '2026-09-05', '2026-09-06'),
  ('fcknye-festival', '2025-12-30', '2026-01-01'),
  ('francofolies-esch', '2026-06-12', '2026-06-14'),
  ('holy-ship-wrecked', '2026-01-22', '2026-01-26'),
  ('into-the-woods', '2026-09-18', '2026-09-19'),
  ('les-deferlantes', '2026-07-11', '2026-07-13'),
  ('lollapalooza-berlin', '2026-07-18', '2026-07-19'),
  ('neon-countdown', '2025-12-30', '2025-12-31'),
  ('ostend-beach-festival', '2026-07-10', '2026-07-12'),
  ('rave-on-snow', '2026-12-10', '2026-12-13'),
  ('rfm-somnii', '2026-07-10', '2026-07-12'),
  ('rock-werchter', '2026-07-02', '2026-07-05'),
  ('solidays', '2026-06-26', '2026-06-28'),
  ('sonus', '2026-08-16', '2026-08-20'),
  ('sunburn', '2026-12-18', '2026-12-20'),
  ('time-warp-spain', '2026-09-18', '2026-09-19'),
  ('toxicator', '2026-12-05', '2026-12-06'),
  ('transmission', '2026-11-28', '2026-11-28'),
  ('woodstoig', '2026-07-31', '2026-08-02'),
  ('world-club-dome-malta', '2026-08-01', '2026-08-02')
) as v(slug, start_date, end_date)
join public.festivals f on f.slug = v.slug
on conflict (festival_id, year) do update
  set start_date = excluded.start_date, end_date = excluded.end_date;

with lineup(slug, artist_name, order_index) as (
  values
    -- Delta Festival 2026
    ('delta-festival', 'Kungs', 0), ('delta-festival', 'Adam Beyer', 1),
    ('delta-festival', 'Benny Benassi', 2), ('delta-festival', 'Cascada', 3),
    ('delta-festival', 'Cerrone', 4), ('delta-festival', 'Miss Monique', 5),
    ('delta-festival', 'Franglish', 6),

    -- Elektric Park 2026
    ('elektric-park', 'Bob Sinclar', 0), ('elektric-park', 'Kavinsky', 1),
    ('elektric-park', 'Petit Biscuit', 2), ('elektric-park', 'Joachim Garraud', 3),

    -- Francofolies Esch-sur-Alzette 2026
    ('francofolies-esch', 'Macklemore', 0), ('francofolies-esch', 'Feu! Chatterton', 1),
    ('francofolies-esch', 'Mosimann', 2), ('francofolies-esch', 'PLK', 3),
    ('francofolies-esch', 'Niska', 4), ('francofolies-esch', 'Gims', 5),
    ('francofolies-esch', 'Helena', 6), ('francofolies-esch', 'Christophe Maé', 7),

    -- Les Déferlantes 2026
    ('les-deferlantes', 'Aya Nakamura', 0), ('les-deferlantes', 'Sean Paul', 1),
    ('les-deferlantes', 'Martin Garrix', 2), ('les-deferlantes', 'Gims', 3),
    ('les-deferlantes', 'Armin van Buuren', 4), ('les-deferlantes', 'Damso', 5),
    ('les-deferlantes', 'Matt Pokora', 6), ('les-deferlantes', 'Afrojack', 7),
    ('les-deferlantes', 'Kungs', 8), ('les-deferlantes', 'PLK', 9),
    ('les-deferlantes', 'Niska', 10), ('les-deferlantes', 'Petit Biscuit', 11),
    ('les-deferlantes', 'Magic System', 12), ('les-deferlantes', 'Theodora', 13),

    -- Solidays 2026 (cancelled due to heatwave, but lineup was announced)
    ('solidays', 'Orelsan', 0), ('solidays', 'Gims', 1),
    ('solidays', 'Zara Larsson', 2), ('solidays', 'Bigflo & Oli', 3),
    ('solidays', 'Major Lazer', 4), ('solidays', 'Vald', 5),
    ('solidays', 'Gazo', 6)
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
  and f.slug in ('delta-festival', 'elektric-park', 'francofolies-esch', 'les-deferlantes', 'solidays');
