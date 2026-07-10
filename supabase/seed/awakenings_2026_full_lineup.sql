-- ============================================================
-- Awakenings Festival 2026 — full lineup from the official poster
-- (July 10-12, 2026). Replaces the earlier ~17-artist manual subset
-- with the complete ~122-act bill: existing edition_artists rows for
-- this edition are cleared and re-inserted fresh (the old partial list
-- is a strict subset of this one, so nothing is lost).
-- ============================================================

delete from public.edition_artists ea
using public.festival_editions e, public.festivals f
where ea.edition_id = e.id
  and e.festival_id = f.id
  and f.slug = 'awakenings'
  and e.year = 2026;

insert into public.artists (name)
select v.name
from (values
  ('999999999'), ('AAT'), ('Adam Beyer'), ('Adam Ten'), ('Adiel'), ('Adrián Mills'),
  ('Adriatique'), ('Akua x Henning Baer'), ('Ali3n'), ('Amber Broos x Juliet Fox'),
  ('Amelie Lens'), ('Anetha'), ('Ares Carter'), ('Azyr'), ('Bad Boombox'), ('Bart Skils'),
  ('Ben Klock'), ('Benja x Franc Fala'), ('Beste Hira'), ('Bianka'), ('Biia'),
  ('Boris Brejcha'), ('Bullzeye'), ('Charlotte de Witte'), ('Chlär x Yanamaste'),
  ('Chris Avantgarde'), ('Cloonee'), ('Cloudy'), ('Colyn'),
  ('Cynthia Spiering x Reinier Zonneveld'),
  ('Dax J'), ('DJ Gigola x Funk Tribu'), ('DJ Heartstring'), ('DJ Rush'), ('Dyen'),
  ('East End Dubs x Vintage Culture'), ('Easttown'), ('Eli Brown x Hi-Lo'), ('Elli Acula'),
  ('Enrico Sangiuliano'), ('Enzo Siragusa'), ('Estella Boersma'), ('Fatima Hajji'),
  ('Fiene'), ('FJAAK'), ('Franck x Upper90'), ('Franky Rizardo'), ('Freddy K'), ('Gordo'),
  ('Grace Dahl'), ('I Hate Models'), ('Ignez'), ('Indira Paganotto'), ('Innellea'),
  ('Isabel Soto'), ('Jamback x Marsolo'), ('Joëlla Jackson'), ('Joris Voorn x Kevin de Vries'),
  ('Joseph Capriati'), ('Josh Baker'), ('Joyhauser'), ('Julia Maria'), ('Julian Fijma'),
  ('Julya Karma'), ('Kara Okay'), ('Kaufmann'), ('Kettama'), ('Lacchesi'), ('Lammer'),
  ('Len Faki'), ('Lisa Korver'), ('Lobster'), ('Locus Error'), ('Lucky Done Gone'),
  ('M-High x Sidney Charles'), ('Mac Declos'), ('Mahmut Orhan x Shimza'), ('Malugi'),
  ('Marco Carola'), ('Marrøn'), ('Mau P'), ('Max Dean x Prospa'), ('MCR-T x Partiboi69'),
  ('Mha Iri'), ('Mischluft'), ('Miss Monique'), ('Nico Moreno'), ('Niiomi'), ('Nikolina'),
  ('Nina Kraviz'), ('Nova:II (Cincity & Philou Louzolo)'), ('Novah'), ('Odymel'),
  ('Olive Anguz'), ('Øtta'), ('Paige Tomlinson'), ('Pan-Pot'), ('Patrick Mason'),
  ('Pegassi'), ('Philippa Pacho'), ('Philou Louzolo'), ('Rene Wise'), ('Richie Hawtin'),
  ('Rødhåd'), ('Rosati'), ('Saidah'), ('Samoh'), ('Secret Cinema'), ('Serafina'), ('SHDW'),
  ('She/Her'), ('Southstar'), ('Speedy J'), ('Stephan Bodzin'), ('Stranger x Talismann'),
  ('Toman'), ('Future.666 x Überkikz'), ('Valody'), ('Ve/Ra'), ('Vladimir Dubyshkin'),
  ('Wade'), ('Zisko')
) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values
    ('999999999', 0), ('AAT', 1), ('Adam Beyer', 2), ('Adam Ten', 3), ('Adiel', 4),
    ('Adrián Mills', 5), ('Adriatique', 6), ('Akua x Henning Baer', 7), ('Ali3n', 8),
    ('Amber Broos x Juliet Fox', 9), ('Amelie Lens', 10), ('Anetha', 11), ('Ares Carter', 12),
    ('Azyr', 13), ('Bad Boombox', 14), ('Bart Skils', 15), ('Ben Klock', 16),
    ('Benja x Franc Fala', 17), ('Beste Hira', 18), ('Bianka', 19), ('Biia', 20),
    ('Boris Brejcha', 21), ('Bullzeye', 22), ('Charlotte de Witte', 23),
    ('Chlär x Yanamaste', 24), ('Chris Avantgarde', 25), ('Cloonee', 26), ('Cloudy', 27),
    ('Colyn', 28), ('Cynthia Spiering x Reinier Zonneveld', 29),
    ('Dax J', 30), ('DJ Gigola x Funk Tribu', 31), ('DJ Heartstring', 32), ('DJ Rush', 33),
    ('Dyen', 34), ('East End Dubs x Vintage Culture', 35), ('Easttown', 36),
    ('Eli Brown x Hi-Lo', 37), ('Elli Acula', 38), ('Enrico Sangiuliano', 39),
    ('Enzo Siragusa', 40), ('Estella Boersma', 41), ('Fatima Hajji', 42), ('Fiene', 43),
    ('FJAAK', 44), ('Franck x Upper90', 45), ('Franky Rizardo', 46), ('Freddy K', 47),
    ('Gordo', 48), ('Grace Dahl', 49), ('I Hate Models', 50), ('Ignez', 51),
    ('Indira Paganotto', 52), ('Innellea', 53), ('Isabel Soto', 54), ('Jamback x Marsolo', 55),
    ('Joëlla Jackson', 56), ('Joris Voorn x Kevin de Vries', 57), ('Joseph Capriati', 58),
    ('Josh Baker', 59), ('Joyhauser', 60), ('Julia Maria', 61), ('Julian Fijma', 62),
    ('Julya Karma', 63), ('Kara Okay', 64), ('Kaufmann', 65), ('Kettama', 66),
    ('Lacchesi', 67), ('Lammer', 68), ('Len Faki', 69), ('Lisa Korver', 70), ('Lobster', 71),
    ('Locus Error', 72), ('Lucky Done Gone', 73), ('M-High x Sidney Charles', 74),
    ('Mac Declos', 75), ('Mahmut Orhan x Shimza', 76), ('Malugi', 77), ('Marco Carola', 78),
    ('Marrøn', 79), ('Mau P', 80), ('Max Dean x Prospa', 81), ('MCR-T x Partiboi69', 82),
    ('Mha Iri', 83), ('Mischluft', 84), ('Miss Monique', 85), ('Nico Moreno', 86),
    ('Niiomi', 87), ('Nikolina', 88), ('Nina Kraviz', 89),
    ('Nova:II (Cincity & Philou Louzolo)', 90), ('Novah', 91), ('Odymel', 92),
    ('Olive Anguz', 93), ('Øtta', 94), ('Paige Tomlinson', 95), ('Pan-Pot', 96),
    ('Patrick Mason', 97), ('Pegassi', 98), ('Philippa Pacho', 99), ('Philou Louzolo', 100),
    ('Rene Wise', 101), ('Richie Hawtin', 102), ('Rødhåd', 103), ('Rosati', 104),
    ('Saidah', 105), ('Samoh', 106), ('Secret Cinema', 107), ('Serafina', 108),
    ('SHDW', 109), ('She/Her', 110), ('Southstar', 111), ('Speedy J', 112),
    ('Stephan Bodzin', 113), ('Stranger x Talismann', 114), ('Toman', 115),
    ('Future.666 x Überkikz', 116), ('Valody', 117), ('Ve/Ra', 118),
    ('Vladimir Dubyshkin', 119), ('Wade', 120), ('Zisko', 121)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'awakenings'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'awakenings' and e.year = 2026;
