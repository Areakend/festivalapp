-- 2027 edition dates for festivals whose 2026 edition just finished (as of
-- 2026-07-18), limited to dates explicitly confirmed by an official source
-- (festival's own site, or a named news outlet with a dated article) —
-- verified via web search, cross-checked with a direct fetch of the
-- official page for a sample before applying. Festivals with no official
-- 2027 announcement yet (the majority, at ~11 months out) are intentionally
-- left alone rather than guessed from last year's pattern.
--
-- Note: musicfestivalwizard.com was seen citing a 2027 date for Primavera
-- Sound that Primavera's own site does not carry — excluded as unreliable.

insert into festival_editions (festival_id, year, start_date, end_date)
select f.id, 2027, v.start_date::date, v.end_date::date
from (values
  ('Ostend Beach Festival',            '2027-07-09', '2027-07-11'),
  ('RFM Somnii',                       '2027-07-09', '2027-07-11'),
  ('Awakenings',                       '2027-07-09', '2027-07-11'),
  ('Ultra Europe',                     '2027-07-09', '2027-07-11'),
  ('Airbeat One',                      '2027-07-07', '2027-07-11'),
  ('Electric Love',                    '2027-07-08', '2027-07-10'),
  ('Festival Beauregard',              '2027-06-30', '2027-07-04'),
  ('Rock Werchter',                    '2027-07-01', '2027-07-04'),
  ('Les Ardentes',                     '2027-07-01', '2027-07-04'),
  ('Kappa FuturFestival',              '2027-07-02', '2027-07-04'),
  ('Hideout Festival',                 '2027-06-29', '2027-07-02'),
  ('Defqon.1',                         '2027-06-24', '2027-06-27'),
  ('Parklife',                         '2027-07-10', '2027-07-11'),
  ('Hellfest',                         '2027-06-17', '2027-06-20'),
  ('Sónar',                            '2027-06-17', '2027-06-19'),
  ('Francofolies Esch-sur-Alzette',    '2027-06-11', '2027-06-13'),
  ('World Club Dome',                  '2027-06-04', '2027-06-06'),
  ('Nameless Festival',                '2027-06-04', '2027-06-06'),
  ('Movement Music Festival',          '2027-05-29', '2027-05-31'),
  ('EDC Las Vegas',                    '2027-05-13', '2027-05-24')
) as v(name, start_date, end_date)
join festivals f on f.name = v.name
on conflict (festival_id, year) do update
  set start_date = excluded.start_date,
      end_date = excluded.end_date;
