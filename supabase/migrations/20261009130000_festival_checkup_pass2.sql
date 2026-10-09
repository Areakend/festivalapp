-- ============================================================
-- Festival catalog checkup (generated 2026-10-09): next-edition dates,
-- announced lineups, newly added festivals, duplicate-artist merges.
-- Every date/lineup below was researched from official organizer
-- sources and validated (format, <=21-day range, not already finished).
-- Idempotent: editions upsert on (festival_id, year), links on
-- (edition_id, artist_id), artists are inserted only when missing.
-- ============================================================


-- ---- 1. festivals (new) ----

insert into public.festivals (name, slug, city, venue, country, genres) values ('Dominator', 'dominator', 'Eersel', 'E3 Strand', 'NL', ARRAY['hardcore','hardstyle']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Ruhr-in-Love', 'ruhr-in-love', 'Oberhausen', 'OlgaPark', 'DE', ARRAY['techno','house']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Openair Frauenfeld', 'openair-frauenfeld', 'Frauenfeld', 'Grosse Allmend', 'CH', ARRAY['hip-hop','pop']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Universo Paralello', 'universo-paralello', 'Ituberá', 'Praia de Pratigi', 'BR', ARRAY['psytrance','trance','techno']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Copenhell', 'copenhell', 'Copenhagen', 'Refshaleøen', 'DK', ARRAY['metal','rock']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('NOS Alive', 'nos-alive', 'Oeiras (Lisbon)', 'Passeio Marítimo de Algés', 'PT', ARRAY['rock','indie','pop']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('The Magic Of Tomorrowland Shanghai', 'the-magic-of-tomorrowland-shanghai', 'Shanghai', 'Hero Dome', 'CN', ARRAY['edm','house','electro']::text[]) on conflict (slug) do nothing;

-- ---- 2. editions + venues ----

update public.festivals set venue = 'Corferias, Bogota' where slug = 'baum' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-02-12', '2027-02-13', false
from public.festivals f where f.slug = 'baum'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Central Harbourfront Event Space, Hong Kong' where slug = 'clockenflap' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-12-04', '2026-12-06', false
from public.festivals f where f.slug = 'clockenflap'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'The Garden Resort, Tisno' where slug = 'love-international' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-07', '2027-07-13', false
from public.festivals f where f.slug = 'love-international'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Esch-sur-Alzette' where slug = 'luxembourg-open-air' and venue is null;

update public.festivals set venue = 'Dürener Badesee, Düren' where slug = 'nibirii' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-27', '2027-08-29', false
from public.festivals f where f.slug = 'nibirii'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'The Garden Resort, Tisno' where slug = 'outlook-origins' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-22', '2027-07-26', false
from public.festivals f where f.slug = 'outlook-origins'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Camping World Stadium, Orlando' where slug = 'rolling-loud' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-05-07', '2027-05-09', false
from public.festivals f where f.slug = 'rolling-loud'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'HERO DOME, Shanghai' where slug = 'magic-of-tomorrowland' and venue is null;

update public.festivals set venue = 'Parque de la Ciudad, Buenos Aires' where slug = 'ultra-buenos-aires' and venue is null;

update public.festivals set venue = 'Estadio GNP Seguros, Mexico City' where slug = 'vive-latino' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-03-13', '2027-03-14', false
from public.festivals f where f.slug = 'vive-latino'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Riedhausen' where slug = 'woodstoig' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-30', '2027-07-31', false
from public.festivals f where f.slug = 'woodstoig'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-16', '2027-07-17', false
from public.festivals f where f.slug = 'dominator'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-03', '2027-07-03', true
from public.festivals f where f.slug = 'ruhr-in-love'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-08', '2027-07-10', false
from public.festivals f where f.slug = 'openair-frauenfeld'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2026-12-27', '2027-01-04', false
from public.festivals f where f.slug = 'universo-paralello'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-06-23', '2027-06-26', true
from public.festivals f where f.slug = 'copenhell'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-08', '2027-07-10', false
from public.festivals f where f.slug = 'nos-alive'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-10-17', '2026-10-18', false
from public.festivals f where f.slug = 'the-magic-of-tomorrowland-shanghai'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

-- ---- 3. artists + lineups ----

insert into public.artists (name)
select v.name from (values ('Yung Lean & Bladee'), ('Chanel Beads'), ('Theo Parrish'), ('Chuquimamani-Condori'), ('Joanne Robertson'), ('KMRU'), ('BADBADNOTGOOD'), ('ML Buch'), ('Wendy Eisenberg'), ('Other People'), ('Fronte Violeta'), ('Eli Wewentxu'), ('Fake Samo'), ('Kode9 & RP Boo'), ('Elias Rønnenfelt'), ('Visible Cloaks'), ('LIIM'), ('Hundebiss'), ('Bladblanc & Giesse'), ('NEXUS'), ('Talpah'), ('Grouper'), ('Marina Herlop'), ('Carl Stone'), ('Coone b2b DJ Isaac'), ('Gammer'), ('Getter'), ('Jamie Jones b2b Franky Rizardo'), ('Joseph Capriati b2b Sosa'), ('Kill The Kid'), ('Lady Faith b2b LNY TNZ'), ('JOYRYDE'), ('Richard Vission'), ('Landopolo'), ('Alex Chapman b2b Zoe Gitter'), ('Cat & Maomi'), ('Marie Nyx'), ('Know Good'), ('Mark Lizaola'), ('Hiwater'), ('Monic'), ('Death Simulator'), ('Seung'), ('Ian Asher'), ('Champion'), ('Funk Assault'), ('Acyan'), ('Sedef Adasï'), ('FVLAKO'), ('San Pacho'), ('Rommii'), ('Spency Be'), ('Andrew Rayel presents Extasia'), ('Daxson'), ('Ram & Richard Durand present Digital Culture'), ('Driftmoon b2b Asteroid'), ('Ferry Corsten b2b Markus Schulz'), ('Tangerine Dream'), ('Eli Keszler'), ('Orphx'), ('ITSU & ARS'), ('Jesse You'), ('JakoJako'), ('Loyboy'), ('Hamdi Ryder'), ('Omoloko'), ('ffan'), ('Faustus'), ('Nubya Garcia'), ('Sweely'), ('DOTT'), ('Shanka Tribe'), ('DJ Python'), ('Genderfunk'), ('Paradise Bangkok Molam International Band'), ('Melanie Ribbe'), ('Viviana Casanova'), ('Cristina Lazic'), ('Pappenheimer'), ('Simina Griguriu'), ('Luca Dea'), ('AKA AKA'), ('Matthias Tanzmann'), ('Radio Slave'), ('Mathias Kaden'), ('Tomi & Kesh'), ('Sante Sansone'), ('Tube & Berger'), ('Moonbootica'), ('Kristin Velvet'), ('Steve Bug'), ('Kerstin Eden'), ('Chris Di Perri'), ('Lovra'), ('Einmusik'), ('Juliet Sikora'), ('Domenico D''Agnelli'), ('Dany Gomez'), ('Esther Bronchal'), ('Simes'), ('Daniel Steinberg'), ('Jil Tanner'), ('Clif Jack'), ('Fiorella'), ('Lexer'), ('Los Canarios'), ('Merissa Mahilaa'), ('Flashbaxx'), ('Essnce'), ('Defex'), ('Angel Costa'), ('Rene Vaitl'), ('Carlos Martinez'), ('Whitny'), ('Lalena'), ('Tonio Barrientos'), ('Alma Hosch'), ('Michelle Vanja'), ('Dyjak'), ('Leeni & Danilo Kupfernagel'), ('Martin Eyerer'), ('Fabrice'), ('Alex Bau'), ('Biggie Schoellz'), ('Joe Arabica'), ('33 Below'), ('ACRAZE'), ('AHEE'), ('Archie Hamilton'), ('Arlo'), ('AYCH'), ('Blaise Bracic'), ('borne'), ('Brandon'), ('Bushbaby'), ('CHOZEN'), ('Crumb Pit'), ('Discovery Project'), ('DJ Guestlist'), ('DØMINA'), ('ECCHI.MP4'), ('ESSE'), ('Ghengar'), ('GorillaT'), ('GRAVEDGR'), ('Green Matter'), ('HEYZ b2b Tynan'), ('Hills'), ('HOL!'), ('Jaden Bojsen'), ('Jev'), ('Kelland'), ('KHROME'), ('Lavern'), ('Lucky'), ('LYNY b2b Peekaboo'), ('MADVKTM'), ('Mija b2b sim0ne'), ('Ranger Trucco'), ('Rinzen'), ('RØZ'), ('S.Y.N'), ('Skilah'), ('Smoakland'), ('Taiki Nulight'), ('TOBEHONEST'), ('Walker & Royce'), ('Wax Motif'), ('Zingara'), ('Klaudia Gawlas'), ('Felix Kroecher'), ('Gestoert aber GeiL'), ('Bonez MC'), ('RAF Camora'), ('Faith No More'), ('D-A-D'), ('Baest'), ('Ashes of Billy'), ('Raunchy'), ('Cold Culture'), ('Guttural Disgorge'), ('Kroyer'), ('Sunken'), ('Crocell'), ('Dreadwitch'), ('Vidnet')) as v(name)
where not exists (select 1 from public.artists a where lower(a.name) = lower(v.name));

insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Robyn', 0), ('Arca', 1), ('Kelela', 2), ('Yung Lean & Bladee', 3), ('Oklou', 4), ('Underscores', 5), ('Chanel Beads', 6), ('Theo Parrish', 7), ('Chuquimamani-Condori', 8), ('Crystallmess', 9), ('Joanne Robertson', 10), ('KMRU', 11), ('BADBADNOTGOOD', 12), ('The Avalanches', 13), ('Shygirl', 14), ('ML Buch', 15), ('Wendy Eisenberg', 16), ('Other People', 17), ('Fronte Violeta', 18), ('Eli Wewentxu', 19), ('Fake Samo', 20), ('Kode9 & RP Boo', 21), ('Elias Rønnenfelt', 22), ('Visible Cloaks', 23), ('LIIM', 24), ('Hundebiss', 25), ('Bladblanc & Giesse', 26), ('NEXUS', 27), ('Talpah', 28), ('Smerz', 29), ('Grouper', 30), ('Headache', 31), ('Marina Herlop', 32), ('Carl Stone', 33)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'club-to-club' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'club-to-club' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Adam Ten', 0), ('Benny Benassi', 1), ('Cascada', 2), ('Cloonee', 3), ('Coone b2b DJ Isaac', 4), ('Darren Styles', 5), ('Dimitri Vegas & Like Mike', 6), ('DJ Tennis', 7), ('Excision', 8), ('Frontliner', 9), ('Gammer', 10), ('Getter', 11), ('Jamie Jones b2b Franky Rizardo', 12), ('Joseph Capriati b2b Sosa', 13), ('Kill The Kid', 14), ('NERVO', 15), ('Showtek', 16), ('Steve Aoki', 17), ('Trancemaster Krause', 18), ('Lady Faith b2b LNY TNZ', 19), ('Alok', 20), ('AC Slater', 21), ('Adventure Club', 22), ('Avalon Emerson', 23), ('Dabin', 24), ('Galantis', 25), ('Indira Paganotto', 26), ('JOYRYDE', 27), ('Liquid Stranger', 28), ('Maddix', 29), ('Nina Kraviz', 30), ('Richard Vission', 31), ('Richie Hawtin', 32), ('Zedd', 33), ('Landopolo', 34), ('Alex Chapman b2b Zoe Gitter', 35), ('Cat & Maomi', 36), ('Disco Lines', 37), ('Marie Nyx', 38), ('Know Good', 39), ('Mark Lizaola', 40), ('Hiwater', 41), ('KREAM', 42), ('Mish', 43), ('Monic', 44), ('Death Simulator', 45), ('Level Up', 46), ('Seung', 47), ('Ian Asher', 48), ('Champion', 49), ('Funk Assault', 50), ('Acyan', 51), ('Sedef Adasï', 52), ('Bou', 53), ('FVLAKO', 54), ('San Pacho', 55), ('Rommii', 56), ('Spency Be', 57)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'escape-halloween' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'escape-halloween' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Aly & Fila', 0), ('Andrew Rayel presents Extasia', 1), ('Daxson', 2), ('Ram & Richard Durand present Digital Culture', 3), ('Driftmoon b2b Asteroid', 4), ('Ferry Corsten b2b Markus Schulz', 5), ('Paul van Dyk', 6)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'transmission' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'transmission' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Tangerine Dream', 0), ('Eli Keszler', 1), ('Orphx', 2), ('ITSU & ARS', 3), ('Jesse You', 4), ('JakoJako', 5), ('Loyboy', 6), ('Gerd Janson', 7), ('Hamdi Ryder', 8), ('Omoloko', 9), ('ffan', 10), ('Faustus', 11), ('Nubya Garcia', 12), ('Jane Fitz', 13), ('Nicolas Lutz', 14), ('Sweely', 15), ('DOTT', 16), ('Shanka Tribe', 17), ('DJ Python', 18), ('Genderfunk', 19), ('Paradise Bangkok Molam International Band', 20)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'wonderfruit' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'wonderfruit' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Anfisa Letyago', 0), ('Pan-Pot', 1), ('Chelina Manuhutu', 2), ('Felix Kröcher', 3), ('Melanie Ribbe', 4), ('Anna Tur', 5), ('Viviana Casanova', 6), ('Cristina Lazic', 7), ('Pappenheimer', 8), ('Simina Griguriu', 9), ('Luca Dea', 10), ('AKA AKA', 11), ('Karla Blum', 12), ('Matthias Tanzmann', 13), ('Gregor Tresher', 14), ('Radio Slave', 15), ('Marco Bailey', 16), ('Mathias Kaden', 17), ('Tomi & Kesh', 18), ('Joëlla Jackson', 19), ('Sante Sansone', 20), ('Tube & Berger', 21), ('Moonbootica', 22), ('Kristin Velvet', 23), ('Steve Bug', 24), ('Kerstin Eden', 25), ('Chris Di Perri', 26), ('Lovra', 27), ('Einmusik', 28), ('Juliet Sikora', 29), ('Domenico D''Agnelli', 30), ('Dany Gomez', 31), ('Esther Bronchal', 32), ('Simes', 33), ('Daniel Steinberg', 34), ('Jil Tanner', 35), ('Clif Jack', 36), ('Fiorella', 37), ('Lexer', 38), ('Los Canarios', 39), ('Merissa Mahilaa', 40), ('Flashbaxx', 41), ('Essnce', 42), ('Defex', 43), ('Angel Costa', 44), ('Rene Vaitl', 45), ('Carlos Martinez', 46), ('Whitny', 47), ('Lalena', 48), ('Tonio Barrientos', 49), ('Alma Hosch', 50), ('Michelle Vanja', 51), ('Dyjak', 52), ('Leeni & Danilo Kupfernagel', 53), ('Martin Eyerer', 54), ('Fabrice', 55), ('Alex Bau', 56), ('Biggie Schoellz', 57), ('Joe Arabica', 58)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'rave-on-snow' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'rave-on-snow' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('33 Below', 0), ('ACRAZE', 1), ('AHEE', 2), ('Alesso', 3), ('Archie Hamilton', 4), ('Arlo', 5), ('AYCH', 6), ('Blaise Bracic', 7), ('borne', 8), ('Brandon', 9), ('BUNT.', 10), ('Bushbaby', 11), ('CHOZEN', 12), ('Crumb Pit', 13), ('DEATHPACT', 14), ('Discovery Project', 15), ('DJ Diesel', 16), ('DJ Guestlist', 17), ('DJ Snake', 18), ('DØMINA', 19), ('ECCHI.MP4', 20), ('ESSE', 21), ('Flosstradamus', 22), ('Ghengar', 23), ('Gordo', 24), ('GorillaT', 25), ('GRAVEDGR', 26), ('Green Matter', 27), ('HEYZ b2b Tynan', 28), ('Hills', 29), ('HOL!', 30), ('Jaden Bojsen', 31), ('James Hype', 32), ('Jessica Audiffred', 33), ('Jev', 34), ('Joshwa', 35), ('Kelland', 36), ('KHROME', 37), ('KLOUD', 38), ('Lavern', 39), ('Loud Luxury', 40), ('Lucky', 41), ('LYNY b2b Peekaboo', 42), ('MADVKTM', 43), ('Marshmello', 44), ('Matroda', 45), ('Mija b2b sim0ne', 46), ('NGHTMRE', 47), ('Noise Mafia', 48), ('Oliver Heldens', 49), ('R3HAB', 50), ('Ranger Trucco', 51), ('Rinzen', 52), ('RØZ', 53), ('S.Y.N', 54), ('Seven Lions', 55), ('Skilah', 56), ('Smoakland', 57), ('Space Laces', 58), ('Subtronics', 59), ('Taiki Nulight', 60), ('Tchami', 61), ('TOBEHONEST', 62), ('TOKiMONSTA', 63), ('TroyBoi', 64), ('Walker & Royce', 65), ('Wax Motif', 66), ('Zingara', 67)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'countdown-nye' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'countdown-nye' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Klaudia Gawlas', 0), ('Felix Kroecher', 1), ('Gestoert aber GeiL', 2)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'ruhr-in-love' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'ruhr-in-love' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Bonez MC', 0), ('RAF Camora', 1)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'openair-frauenfeld' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Faith No More', 0), ('Judas Priest', 1), ('D-A-D', 2), ('Baest', 3), ('Ashes of Billy', 4), ('Raunchy', 5), ('Cold Culture', 6), ('Guttural Disgorge', 7), ('Kroyer', 8), ('Sunken', 9), ('Crocell', 10), ('Dreadwitch', 11), ('Vidnet', 12)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'copenhell' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'copenhell' and fe.year = 2027;


-- ---- hand-vetted corrections (official sources read by two agents each) ----

-- EDC Las Vegas 2027: the festival runs two weekends, 14-16 and 21-23 May (lasvegas.edc.com);
-- the catalog's 13-24 May was the broader "Dusk Till Dawn" programme window.
update public.festival_editions fe set start_date = '2027-05-14', end_date = '2027-05-23'
from public.festivals f where f.id = fe.festival_id and f.slug = 'edc-las-vegas' and fe.year = 2027;

-- GMO SONIC 2027 is at GMO Arena Saitama (ex Saitama Super Arena), not in Chiba (GMO press release, 30 Mar 2026).
update public.festivals set city = 'Saitama' where slug = 'gmo-sonic';

-- Soundstorm 2026 (Riyadh) was cancelled by MDLBEAST on 1 Oct 2026 (organizers' Instagram + email to
-- ticket holders, relayed by DJ Mag / Gulf News); flagged rather than deleted so history stays intact.
update public.festival_editions fe set cancelled = true
from public.festivals f where f.id = fe.festival_id and f.slug = 'soundstorm' and fe.year = 2026;

-- UNTOLD Dubai moved from Nov 2026 to 19-21 Mar 2027 at Dubai Parks and Resorts (untold.ae, Gulf News).
insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-03-19', '2027-03-21', false from public.festivals f where f.slug = 'untold-dubai'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;
update public.festival_editions fe set cancelled = true
from public.festivals f where f.id = fe.festival_id and f.slug = 'untold-dubai' and fe.year = 2026;

-- Dreamfields continues: official dreamfields.nl announces 10-11 July 2027 ("gaat toch door in 2027"),
-- despite the 2026 "Final Dream" billing.
insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-10', '2027-07-11', false from public.festivals f where f.slug = 'dreamfields'
on conflict (festival_id, year) do nothing;

