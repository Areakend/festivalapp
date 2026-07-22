
-- rock-werchter 2026

insert into public.artists (name)
select v.name
from (values ('A Perfect Circle'), ('Adrian Quesada''s Trio Asesino'), ('Agnes Obel'), ('Alice Mae'), ('All Them Witches'), ('Bad Nerves'), ('Balu Brigada'), ('Basht.'), ('Beirut'), ('Ben Ellis'), ('Bente'), ('Bleech'), ('Blood Incantation'), ('Cardinals'), ('Charlotte de Witte'), ('Chezile'), ('CMAT'), ('Cory Wong'), ('The Cure'), ('Darren Kiely'), ('David Byrne'), ('Dogstar'), ('Don West'), ('Dressed Like Boys'), ('Dylan Gossett'), ('Ecca Vandal'), ('Elvis Costello & The Imposters'), ('Ethel Cain'), ('FKA twigs'), ('Florence Road'), ('Franz Ferdinand'), ('Good Neighbours'), ('Gorillaz'), ('HAEVN'), ('Halsey'), ('Harry Mack'), ('The Haunted Youth'), ('High Hi'), ('House Of Protection'), ('ISE'), ('JADE'), ('Jessie Murph'), ('Joy Crookes'), ('Kaat Van Stralen'), ('Kae Tempest'), ('Karen Dió'), ('Kasabian'), ('Keo'), ('Kingfishr'), ('Kneecap'), ('Kokoroko'), ('LA LOM'), ('LANDMVRKS'), ('The Last Dinner Party'), ('Last Train'), ('Lauren Spencer Smith'), ('Lewis Capaldi'), ('Linka Moja'), ('Loyle Carner'), ('The Lumineers'), ('Man/Woman/Chainsaw'), ('Matt Berninger'), ('Midnight Generation'), ('Moby'), ('Mogwai'), ('Monza'), ('Mumford & Sons'), ('NewDad'), ('The New Eves'), ('overpass'), ('Palaye Royale'), ('Paris Paloma'), ('Paul Kalkbrenner'), ('Pixies'), ('The Prodigy'), ('Psychonaut'), ('PUP'), ('Radio Free Alice'), ('Reneé Rapp'), ('The Reytons'), ('Rise Against'), ('Royel Otis'), ('Scene Queen'), ('Sierra Ferrell'), ('Social Distortion'), ('SONS'), ('Teddy Swims'), ('The Vaccines'), ('Tom Smith'), ('Triggerfinger'), ('Tsar B'), ('Twenty One Pilots'), ('Viagra Boys'), ('VOILÀ'), ('The War on Drugs'), ('Westside Cowboy'), ('Wolf Alice'), ('The xx'), ('Yard Act'), ('Yong Yello'), ('Zwangere Guy')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values ('A Perfect Circle', 0), ('Adrian Quesada''s Trio Asesino', 1), ('Agnes Obel', 2), ('Alice Mae', 3), ('All Them Witches', 4), ('Bad Nerves', 5), ('Balu Brigada', 6), ('Basht.', 7), ('Beirut', 8), ('Ben Ellis', 9), ('Bente', 10), ('Bleech', 11), ('Blood Incantation', 12), ('Cardinals', 13), ('Charlotte de Witte', 14), ('Chezile', 15), ('CMAT', 16), ('Cory Wong', 17), ('The Cure', 18), ('Darren Kiely', 19), ('David Byrne', 20), ('Dogstar', 21), ('Don West', 22), ('Dressed Like Boys', 23), ('Dylan Gossett', 24), ('Ecca Vandal', 25), ('Elvis Costello & The Imposters', 26), ('Ethel Cain', 27), ('FKA twigs', 28), ('Florence Road', 29), ('Franz Ferdinand', 30), ('Good Neighbours', 31), ('Gorillaz', 32), ('HAEVN', 33), ('Halsey', 34), ('Harry Mack', 35), ('The Haunted Youth', 36), ('High Hi', 37), ('House Of Protection', 38), ('ISE', 39), ('JADE', 40), ('Jessie Murph', 41), ('Joy Crookes', 42), ('Kaat Van Stralen', 43), ('Kae Tempest', 44), ('Karen Dió', 45), ('Kasabian', 46), ('Keo', 47), ('Kingfishr', 48), ('Kneecap', 49), ('Kokoroko', 50), ('LA LOM', 51), ('LANDMVRKS', 52), ('The Last Dinner Party', 53), ('Last Train', 54), ('Lauren Spencer Smith', 55), ('Lewis Capaldi', 56), ('Linka Moja', 57), ('Loyle Carner', 58), ('The Lumineers', 59), ('Man/Woman/Chainsaw', 60), ('Matt Berninger', 61), ('Midnight Generation', 62), ('Moby', 63), ('Mogwai', 64), ('Monza', 65), ('Mumford & Sons', 66), ('NewDad', 67), ('The New Eves', 68), ('overpass', 69), ('Palaye Royale', 70), ('Paris Paloma', 71), ('Paul Kalkbrenner', 72), ('Pixies', 73), ('The Prodigy', 74), ('Psychonaut', 75), ('PUP', 76), ('Radio Free Alice', 77), ('Reneé Rapp', 78), ('The Reytons', 79), ('Rise Against', 80), ('Royel Otis', 81), ('Scene Queen', 82), ('Sierra Ferrell', 83), ('Social Distortion', 84), ('SONS', 85), ('Teddy Swims', 86), ('The Vaccines', 87), ('Tom Smith', 88), ('Triggerfinger', 89), ('Tsar B', 90), ('Twenty One Pilots', 91), ('Viagra Boys', 92), ('VOILÀ', 93), ('The War on Drugs', 94), ('Westside Cowboy', 95), ('Wolf Alice', 96), ('The xx', 97), ('Yard Act', 98), ('Yong Yello', 99), ('Zwangere Guy', 100)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'rock-werchter'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'rock-werchter' and e.year = 2026;

-- lollapalooza-berlin 2026

insert into public.artists (name)
select v.name
from (values ('Pitbull'), ('Lewis Capaldi'), ('Lorde'), ('Anitta'), ('Teddy Swims'), ('Zara Larsson'), ('Ayliva'), ('Zartmann'), ('Tom Odell'), ('Lily Allen'), ('Boys Noize'), ('Young Miko'), ('The Snuts'), ('makko'), ('ARTBAT'), ('Korolova'), ('Atarashii Gakko!'), ('Balu Brigada'), ('James Marriott'), ('Nieve Ella'), ('Victor Ruiz'), ('Lovefoxy'), ('Jolle'), ('panicbaby'), ('Usted Señalemelo'), ('Baran Kok'), ('Fuju'), ('Schmerzis'), ('Berliner Kneipenchor'), ('Funk Tribu'), ('Noga Erez'), ('Self Esteem'), ('ANNA'), ('Don West'), ('Alessi Rose'), ('Sofia Camara'), ('Trancemaster Krause'), ('Vicky'), ('Pia Klein'), ('Edis')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values ('Pitbull', 0), ('Lewis Capaldi', 1), ('Lorde', 2), ('Anitta', 3), ('Teddy Swims', 4), ('Zara Larsson', 5), ('Ayliva', 6), ('Zartmann', 7), ('Tom Odell', 8), ('Lily Allen', 9), ('Boys Noize', 10), ('Young Miko', 11), ('The Snuts', 12), ('makko', 13), ('ARTBAT', 14), ('Korolova', 15), ('Atarashii Gakko!', 16), ('Balu Brigada', 17), ('James Marriott', 18), ('Nieve Ella', 19), ('Victor Ruiz', 20), ('Lovefoxy', 21), ('Jolle', 22), ('panicbaby', 23), ('Usted Señalemelo', 24), ('Baran Kok', 25), ('Fuju', 26), ('Schmerzis', 27), ('Berliner Kneipenchor', 28), ('Funk Tribu', 29), ('Noga Erez', 30), ('Self Esteem', 31), ('ANNA', 32), ('Don West', 33), ('Alessi Rose', 34), ('Sofia Camara', 35), ('Trancemaster Krause', 36), ('Vicky', 37), ('Pia Klein', 38), ('Edis', 39)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'lollapalooza-berlin'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'lollapalooza-berlin' and e.year = 2026;

-- neon-countdown 2026

insert into public.artists (name)
select v.name
from (values ('Alesso'), ('Amelie Lens'), ('Hardwell'), ('W&W'), ('KSHMR'), ('Nicky Romero'), ('Timmy Trumpet'), ('Dimension'), ('Mesto'), ('Third Party'), ('Mark Bale'), ('Jost'), ('Honey Gee')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values ('Alesso', 0), ('Amelie Lens', 1), ('Hardwell', 2), ('W&W', 3), ('KSHMR', 4), ('Nicky Romero', 5), ('Timmy Trumpet', 6), ('Dimension', 7), ('Mesto', 8), ('Third Party', 9), ('Mark Bale', 10), ('Jost', 11), ('Honey Gee', 12)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'neon-countdown'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'neon-countdown' and e.year = 2026;

-- ravolution 2026

insert into public.artists (name)
select v.name
from (values ('Armin van Buuren'), ('KI/KI'), ('Ruben de Ronde'), ('Nifra'), ('Cosmic Gate'), ('Ferry Corsten presents Gouryella'), ('Maddix'), ('NERVO'), ('Timmy Trumpet')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values ('Armin van Buuren', 0), ('KI/KI', 1), ('Ruben de Ronde', 2), ('Nifra', 3), ('Cosmic Gate', 4), ('Ferry Corsten presents Gouryella', 5), ('Maddix', 6), ('NERVO', 7), ('Timmy Trumpet', 8)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'ravolution'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'ravolution' and e.year = 2026;

-- cercle-music-festival 2026

insert into public.artists (name)
select v.name
from (values ('Aaron Hibell'), ('Acid Pauli'), ('Adriatique'), ('Âme'), ('Sama'' Abdulhadi'), ('Anetha'), ('Anfisa Letyago'), ('ANNA'), ('Arodes'), ('ARTBAT'), ('Ben Böhmer'), ('berlioz'), ('Carlita'), ('Deer Jade'), ('Enfant Sauvage'), ('Eric Prydz'), ('Étienne de Crécy'), ('Funk Tribu'), ('Ginton'), ('Indira Paganotto'), ('Jimi Jules'), ('Kasablanca'), ('KILIMANJARO'), ('Kölsch'), ('Lane 8'), ('LP Giobbi'), ('DJ Tennis'), ('Mahmut Orhan'), ('Marten Lou'), ('meera'), ('Michael Bibi'), ('Mind Against'), ('Miss Monique'), ('Monolink'), ('nimino'), ('Parra for Cuva'), ('Rodrigo Gallardo'), ('Röyksopp'), ('Sammy Virji'), ('Thylacine'), ('Vintage Culture'), ('Weval'), ('YOTTO')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values ('Aaron Hibell', 0), ('Acid Pauli', 1), ('Adriatique', 2), ('Âme', 3), ('Sama'' Abdulhadi', 4), ('Anetha', 5), ('Anfisa Letyago', 6), ('ANNA', 7), ('Arodes', 8), ('ARTBAT', 9), ('Ben Böhmer', 10), ('berlioz', 11), ('Carlita', 12), ('Deer Jade', 13), ('Enfant Sauvage', 14), ('Eric Prydz', 15), ('Étienne de Crécy', 16), ('Funk Tribu', 17), ('Ginton', 18), ('Indira Paganotto', 19), ('Jimi Jules', 20), ('Kasablanca', 21), ('KILIMANJARO', 22), ('Kölsch', 23), ('Lane 8', 24), ('LP Giobbi', 25), ('DJ Tennis', 26), ('Mahmut Orhan', 27), ('Marten Lou', 28), ('meera', 29), ('Michael Bibi', 30), ('Mind Against', 31), ('Miss Monique', 32), ('Monolink', 33), ('nimino', 34), ('Parra for Cuva', 35), ('Rodrigo Gallardo', 36), ('Röyksopp', 37), ('Sammy Virji', 38), ('Thylacine', 39), ('Vintage Culture', 40), ('Weval', 41), ('YOTTO', 42)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'cercle-music-festival'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'cercle-music-festival' and e.year = 2026;

-- ostend-beach-festival 2026

insert into public.artists (name)
select v.name
from (values ('Andromedik'), ('Omdat Het Kan'), ('Average Rob'), ('Michael Amani'), ('Magik'), ('Nina Black'), ('Tola Og'), ('Voltage'), ('Team DAMP'), ('DYEN'), ('BIIA'), ('Negitiv'), ('BYØRN'), ('Callush'), ('Kompass Traxx'), ('Hannah Laing'), ('Amber Broos'), ('Miss Monique'), ('Layla Benitez'), ('Maxim Lany'), ('Sentin'), ('HI-LO'), ('Eli Brown'), ('Kate Ryan'), ('Joris Voorn'), ('Dennis Ferrer'), ('Green Velvet'), ('Dave Clarke'), ('Cherry Moon Legends'), ('Deco'), ('Woodruff')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values ('Andromedik', 0), ('Omdat Het Kan', 1), ('Average Rob', 2), ('Michael Amani', 3), ('Magik', 4), ('Nina Black', 5), ('Tola Og', 6), ('Voltage', 7), ('Team DAMP', 8), ('DYEN', 9), ('BIIA', 10), ('Negitiv', 11), ('BYØRN', 12), ('Callush', 13), ('Kompass Traxx', 14), ('Hannah Laing', 15), ('Amber Broos', 16), ('Miss Monique', 17), ('Layla Benitez', 18), ('Maxim Lany', 19), ('Sentin', 20), ('HI-LO', 21), ('Eli Brown', 22), ('Kate Ryan', 23), ('Joris Voorn', 24), ('Dennis Ferrer', 25), ('Green Velvet', 26), ('Dave Clarke', 27), ('Cherry Moon Legends', 28), ('Deco', 29), ('Woodruff', 30)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'ostend-beach-festival'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'ostend-beach-festival' and e.year = 2026;

-- rfm-somnii 2026

insert into public.artists (name)
select v.name
from (values ('Timmy Trumpet'), ('Diego Miranda'), ('Third Party'), ('Matisse & Sadko'), ('Tiago Cruz'), ('Vertile'), ('DJ Pete'), ('Vini Vici'), ('Will Sparks'), ('Dual Damage'), ('Padre Guilherme'), ('Sick Individuals'), ('Zanova'), ('Nicole Da Silva'), ('Hardwell'), ('Kaaze'), ('KURA'), ('Nifra'), ('Sound Rush'), ('Pedro Carrilho'), ('Rich & Mendes')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values ('Timmy Trumpet', 0), ('Diego Miranda', 1), ('Third Party', 2), ('Matisse & Sadko', 3), ('Tiago Cruz', 4), ('Vertile', 5), ('DJ Pete', 6), ('Vini Vici', 7), ('Will Sparks', 8), ('Dual Damage', 9), ('Padre Guilherme', 10), ('Sick Individuals', 11), ('Zanova', 12), ('Nicole Da Silva', 13), ('Hardwell', 14), ('Kaaze', 15), ('KURA', 16), ('Nifra', 17), ('Sound Rush', 18), ('Pedro Carrilho', 19), ('Rich & Mendes', 20)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'rfm-somnii'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'rfm-somnii' and e.year = 2026;

-- dreamfields 2026

insert into public.artists (name)
select v.name
from (values ('Showtek'), ('D-Block & S-te-Fan'), ('Dyro'), ('Dannic'), ('Julian Jordan'), ('Kav Verhouzer'), ('De Hofnar'), ('La Fuente'), ('Lucas & Steve'), ('Sam Hofman'), ('Thomas Newson'), ('Afro Bros'), ('Bilal Wahib'), ('Butterfly Effect'), ('FeestDJRuud'), ('Freddy Moreira'), ('Noa'), ('Funkerman'), ('Kim Kaos'), ('Tim Hox'), ('Audiotricz'), ('Brennan Heart'), ('D-Sturb'), ('Noisecontrollers'), ('Outsiders'), ('Phuture Noize'), ('Radical Redemption'), ('Rebelion')) as v(name)
where not exists (
  select 1 from public.artists a where lower(a.name) = lower(v.name)
);

with lineup(artist_name, order_index) as (
  values ('Showtek', 0), ('D-Block & S-te-Fan', 1), ('Dyro', 2), ('Dannic', 3), ('Julian Jordan', 4), ('Kav Verhouzer', 5), ('De Hofnar', 6), ('La Fuente', 7), ('Lucas & Steve', 8), ('Sam Hofman', 9), ('Thomas Newson', 10), ('Afro Bros', 11), ('Bilal Wahib', 12), ('Butterfly Effect', 13), ('FeestDJRuud', 14), ('Freddy Moreira', 15), ('Noa', 16), ('Funkerman', 17), ('Kim Kaos', 18), ('Tim Hox', 19), ('Audiotricz', 20), ('Brennan Heart', 21), ('D-Sturb', 22), ('Noisecontrollers', 23), ('Outsiders', 24), ('Phuture Noize', 25), ('Radical Redemption', 26), ('Rebelion', 27)
)
insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, l.order_index
from lineup l
join public.festivals f on f.slug = 'dreamfields'
join public.festival_editions e on e.festival_id = f.id and e.year = 2026
join public.artists a on lower(a.name) = lower(l.artist_name)
on conflict (edition_id, artist_id) do nothing;

update public.festival_editions e
set lineup_published = true
from public.festivals f
where e.festival_id = f.id and f.slug = 'dreamfields' and e.year = 2026;
