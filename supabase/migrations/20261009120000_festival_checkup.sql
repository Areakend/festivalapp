-- ============================================================
-- Festival catalog checkup (generated 2026-10-09): next-edition dates,
-- announced lineups, newly added festivals, duplicate-artist merges.
-- Every date/lineup below was researched from official organizer
-- sources and validated (format, <=21-day range, not already finished).
-- Idempotent: editions upsert on (festival_id, year), links on
-- (edition_id, artist_id), artists are inserted only when missing.
-- ============================================================


-- ============================================================
-- Merge 12 duplicate artist rows (same act, different spelling/accents/
-- punctuation), same guard-then-repoint shape as 20260816110000 and
-- 20260827100000. The canonical row keeps its spelling and inherits any
-- spotify/deezer ids and genres from the duplicate before it is dropped.
-- ============================================================

create or replace function pg_temp.merge_artist(keep_name text, dup_name text) returns void
language plpgsql as $$
declare
  keep_id uuid; dup_id uuid;
  dup_spotify_id text; dup_deezer_id text; dup_genres text[];
begin
  select id into keep_id from public.artists where name = keep_name;
  select id into dup_id from public.artists where name = dup_name;
  if keep_id is null or dup_id is null or keep_id = dup_id then return; end if;

  select spotify_artist_id, deezer_artist_id, genres into dup_spotify_id, dup_deezer_id, dup_genres
    from public.artists where id = dup_id;
  update public.artists set spotify_artist_id = null, deezer_artist_id = null where id = dup_id;
  update public.artists set
    spotify_artist_id = coalesce(spotify_artist_id, dup_spotify_id),
    deezer_artist_id = coalesce(deezer_artist_id, dup_deezer_id),
    genres = (select array(select distinct unnest(genres || dup_genres)))
  where id = keep_id;

  delete from public.edition_artists dup where dup.artist_id = dup_id
    and exists (select 1 from public.edition_artists c where c.artist_id = keep_id and c.edition_id = dup.edition_id);
  update public.edition_artists set artist_id = keep_id where artist_id = dup_id;

  delete from public.artist_follows dup where dup.artist_id = dup_id
    and exists (select 1 from public.artist_follows c where c.artist_id = keep_id and c.user_id = dup.user_id);
  update public.artist_follows set artist_id = keep_id where artist_id = dup_id;

  delete from public.artists where id = dup_id;
end $$;

do $$
begin
  perform pg_temp.merge_artist('Âme', 'Ame');
  perform pg_temp.merge_artist('Héctor Oaks', 'Hector Oaks');
  perform pg_temp.merge_artist('Horse Meat Disco', 'Horsemeat Disco');
  perform pg_temp.merge_artist('Sound Rush', 'Soundrush');
  perform pg_temp.merge_artist('Rossi.', 'Rossi');
  perform pg_temp.merge_artist('Rilès', 'Riles');
  perform pg_temp.merge_artist('Dr.Donk', 'Dr Donk');
  perform pg_temp.merge_artist('F. Noize', 'F.Noize');
  perform pg_temp.merge_artist('25ème Heure', '25emeheure');
  perform pg_temp.merge_artist('Sköne', 'Skone');
  perform pg_temp.merge_artist('47ter', '47 Ter');
  perform pg_temp.merge_artist('Spice Up!', 'Spice Up');
end $$;

-- Past/finished editions whose lineup is imported but still flagged unpublished
-- (Draaimolen, Voodoo Village, Brunch Electronik Lyon, Hard Boat — all took place
-- in September 2026, their lineups are final facts now).
update public.festival_editions fe set lineup_published = true
where not fe.lineup_published
  and exists (select 1 from public.edition_artists ea where ea.edition_id = fe.id);


-- ---- 1. festivals (new) ----

insert into public.festivals (name, slug, city, venue, country, genres) values ('Street Parade', 'street-parade', 'Zürich', 'Zürich lakefront (Seebecken / Limmatquai parade route)', 'CH', ARRAY['techno','house','tech house','trance','edm']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Mayday', 'mayday', 'Dortmund', 'Westfalenhallen', 'DE', ARRAY['techno','hardcore','trance','house']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Reverze', 'reverze', 'Antwerp', 'AFAS Dome (formerly Sportpaleis) and Lotto Arena', 'BE', ARRAY['hardstyle','rawstyle','hardcore']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Field Day', 'field-day', 'London', 'Brockwell Park', 'GB', ARRAY['house','techno','electro','indie']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Main Square Festival', 'main-square-festival', 'Arras', 'La Citadelle d''Arras', 'FR', ARRAY['pop','rock','hip-hop','edm']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Pitchfork Music Festival Paris', 'pitchfork-music-festival-paris', 'Paris', 'Multi-venue (Elysee Montmartre, Badaboum, Trabendo, Main Room, Cafe de la Danse, Supersonic...)', 'FR', ARRAY['indie','rock','experimental','electro']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Les Rencontres Trans Musicales de Rennes', 'les-rencontres-trans-musicales-de-rennes', 'Rennes', 'Parc Expo de Rennes (plus Ubu and other Rennes venues)', 'FR', ARRAY['electro','techno','hip-hop','experimental']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Papillons de Nuit', 'papillons-de-nuit', 'Saint-Laurent-de-Cuves', null, 'FR', ARRAY['pop','rock','hip-hop','electro']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Jazz à Vienne', 'jazz-a-vienne', 'Vienne', 'Théâtre antique de Vienne (also Jardin de Cybèle, Le Club)', 'FR', ARRAY['jazz','soul','funk','pop']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Festival Cabaret Vert', 'festival-cabaret-vert', 'Charleville-Mézières', null, 'FR', ARRAY['rock','metal','pop','electro']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Art Rock', 'art-rock', 'Saint-Brieuc', null, 'FR', ARRAY['rock','pop','electro','indie']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Festival Interceltique de Lorient', 'festival-interceltique-de-lorient', 'Lorient', null, 'FR', ARRAY['folk','pop','experimental']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('La Route du Rock - Collection Hiver', 'la-route-du-rock-collection-hiver', 'Saint-Malo', null, 'FR', ARRAY['indie','rock','electro','experimental']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Printemps de Bourges', 'printemps-de-bourges', 'Bourges', null, 'FR', ARRAY['pop','hip-hop','rock','electro']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Let It Roll', 'let-it-roll', 'Most', 'Jezero Most', 'CZ', ARRAY['drum and bass','bass','dubstep']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Club To Club', 'club-to-club', 'Turin', null, 'IT', ARRAY['electro','experimental','techno','house']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Flow Festival', 'flow-festival', 'Helsinki', 'Suvilahti', 'FI', ARRAY['indie','electro','pop','hip-hop']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Pohoda Festival', 'pohoda-festival', 'Trenčín', 'Trenčín airport', 'SK', ARRAY['indie','rock','electro','hip-hop']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Øya Festival', 'ya-festival', 'Oslo', null, 'NO', ARRAY['indie','pop','hip-hop','electro']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Arenal Sound', 'arenal-sound', 'Burriana', null, 'ES', ARRAY['pop','hip-hop','edm','electro']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Festival Cruïlla', 'festival-cruilla', 'Barcelona', 'Parc del Fòrum', 'ES', ARRAY['pop','rock','hip-hop','indie']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Tons of Rock', 'tons-of-rock', 'Oslo', 'Ekebergsletta', 'NO', ARRAY['metal','rock']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Wonderfruit', 'wonderfruit', 'Chonburi (near Pattaya)', 'The Fields at Siam Country Club', 'TH', ARRAY['house','techno','experimental','disco']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Lost Paradise', 'lost-paradise', 'Glenworth Valley (NSW Central Coast)', 'Glenworth Valley', 'AU', ARRAY['house','techno','drum and bass','electro','disco']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Field Day Sydney', 'field-day-sydney', 'Sydney', 'The Domain', 'AU', ARRAY['house','techno','drum and bass','electro','bass']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Escape Halloween', 'escape-halloween', 'San Bernardino', 'NOS Events Center', 'US', ARRAY['edm','bass','house','trance','hardstyle']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Countdown NYE', 'countdown-nye', 'San Bernardino', 'NOS Events Center', 'US', ARRAY['edm','house','bass','trance','techno']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Lollapalooza Argentina', 'lollapalooza-argentina', 'Buenos Aires', 'Hipódromo de San Isidro', 'AR', ARRAY['pop','rock','hip-hop','edm']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Harmony of Hardcore', 'harmony-of-hardcore', 'Erp', 'Festivalterrein De Roost', 'NL', ARRAY['hardcore','gabber']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Let It Roll Winter', 'let-it-roll-winter', 'Prague', 'Křižík Pavilions', 'CZ', ARRAY['drum and bass']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Boom Festival', 'boom-festival', 'Idanha-a-Nova', 'Boomland (Herdade da Granja)', 'PT', ARRAY['psytrance','trance','experimental']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Dreamstate SoCal', 'dreamstate-socal', 'San Bernardino', 'NOS Events Center', 'US', ARRAY['trance','psytrance','progressive house']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('EDC Colombia', 'edc-colombia', 'Medellin', 'Complejo Deportivo Atanasio Girardot', 'CO', ARRAY['edm','house','techno','trance','bass']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('EDSea', 'edsea', 'Miami', 'Norwegian Joy (Miami to Harvest Caye, Belize)', 'US', ARRAY['edm','house','techno','bass']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Shambhala Music Festival', 'shambhala-music-festival', 'Salmo', 'Salmo River Ranch', 'CA', ARRAY['bass','house','dubstep','experimental']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('O.Z.O.R.A. Festival', 'o-z-o-r-a-festival', 'Ozora', 'Dadpuszta', 'HU', ARRAY['psytrance','trance','experimental']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Sunrise Festival', 'sunrise-festival', 'Kolobrzeg', 'Podczele', 'PL', ARRAY['edm','house','trance']::text[]) on conflict (slug) do nothing;

-- ---- 2. editions + venues ----

update public.festivals set venue = 'Salzburgring' where slug = 'electric-love' and venue is null;

update public.festivals set venue = 'Sölden ski area (Giggijoch, ~2,300 m), Ötztal, Tyrol' where slug = 'electric-mountain-festival' and venue is null;

update public.festivals set venue = 'Mayrhofen, Zillertal' where slug = 'snowbombing' and venue is null;

update public.festivals set venue = 'Klein Strand, Oostende' where slug = 'ostend-beach-festival' and venue is null;

update public.festivals set venue = 'Kiewit, Hasselt' where slug = 'pukkelpop' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-19', '2027-08-22', false
from public.festivals f where f.slug = 'pukkelpop'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Festivalpark, Werchter' where slug = 'rock-werchter' and venue is null;

update public.festivals set venue = 'Ehem. US-Kaserne (former US Army barracks), Texasstraße, 83043 Bad Aibling' where slug = 'echelon-festival' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-20', '2027-08-21', false
from public.festivals f where f.slug = 'ferra'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Olympiastadion & Olympiapark Berlin' where slug = 'lollapalooza-berlin' and venue is null;

update public.festivals set venue = 'Raketenbasis Pydna, Kastellaun' where slug = 'nature-one' and venue is null;

update public.festivals set venue = 'Maimarkthalle, Mannheim' where slug = 'time-warp' and venue is null;

update public.festivals set venue = 'Deutsche Bank Park, Frankfurt' where slug = 'world-club-dome' and venue is null;

update public.festivals set venue = 'Roskilde Festival grounds, Roskilde' where slug = 'roskilde-festival' and venue is null;

update public.festivals set venue = 'Château de Beauregard, Hérouville-Saint-Clair' where slug = 'beauregard' and venue is null;

update public.festivals set venue = 'Esplanade Saint-Jean d''Acre, La Rochelle' where slug = 'francofolies-la-rochelle' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-10', '2027-07-14', false
from public.festivals f where f.slug = 'francofolies-la-rochelle'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Plaine de la Filhole, Marmande' where slug = 'garorock' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-03-05', '2027-03-06', false
from public.festivals f where f.slug = 'jardin-electronique'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Palais des Festivals, Cannes' where slug = 'les-plages-electroniques' and venue is null;

update public.festivals set venue = 'Site de Kerampuilh, Carhaix-Plouguer' where slug = 'les-vieilles-charrues' and venue is null;

update public.festivals set venue = 'Matterley Estate, Winchester' where slug = 'boomtown' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-26', '2027-08-29', false
from public.festivals f where f.slug = 'creamfields'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Donington Park' where slug = 'download-festival' and venue is null;

update public.festivals set venue = 'Worthy Farm, Pilton' where slug = 'glastonbury' and venue is null;

update public.festivals set venue = 'Houghton Hall, King''s Lynn' where slug = 'houghton' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-05', '2027-08-08', false
from public.festivals f where f.slug = 'houghton'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Norton Disney, Lincolnshire' where slug = 'lost-village' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-26', '2027-08-29', false
from public.festivals f where f.slug = 'lost-village'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Heaton Park' where slug = 'parklife' and venue is null;

update public.festivals set venue = 'Richfield Avenue' where slug = 'reading-festival' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-26', '2027-08-29', false
from public.festivals f where f.slug = 'reading-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Neston Park, Corsham, Wiltshire' where slug = 'womad' and venue is null;

update public.festivals set venue = 'The Garden Resort, Tisno' where slug = 'dimensions' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-26', '2027-08-31', false
from public.festivals f where f.slug = 'dimensions'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Zrce Beach, Novalja (Pag)' where slug = 'hideout' and venue is null;

update public.festivals set venue = 'Stradbally Hall, Stradbally, Co. Laois' where slug = 'electric-picnic' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-27', '2027-08-29', false
from public.festivals f where f.slug = 'electric-picnic'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Parco Dora, Turin' where slug = 'kappa-futurfestival' and venue is null;

update public.festivals set venue = 'Bione, Lecco' where slug = 'nameless' and venue is null;

update public.festivals set venue = 'GMO Arena Saitama, Saitama' where slug = 'gmo-sonic' and venue is null;

update public.festivals set venue = 'Tokyo Odaiba Ultra Park' where slug = 'ultra-japan' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-09-18', '2027-09-19', false
from public.festivals f where f.slug = 'ultra-japan'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Ta'' Qali National Park, Malta' where slug = 'glitch' and venue is null;

update public.festivals set venue = 'Safaripark Beekse Bergen, Hilvarenbeek' where slug = 'best-kept-secret' and venue is null;

update public.festivals set venue = 'Gdynia-Kosakowo Airfield' where slug = 'opener-festival' and venue is null;

update public.festivals set venue = 'Praia do Relógio, Figueira da Foz' where slug = 'rfm-somnii' and venue is null;

update public.festivals set venue = 'Slottsskogen, Gothenburg' where slug = 'way-out-west' and venue is null;

update public.festivals set venue = 'Black Rock Desert, Black Rock City, NV' where slug = 'burning-man' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-29', '2027-09-06', false
from public.festivals f where f.slug = 'burning-man'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

update public.festivals set venue = 'Hart Plaza, Detroit' where slug = 'movement' and venue is null;

update public.festivals set venue = 'Golden Gate Park, San Francisco' where slug = 'outside-lands' and venue is null;

update public.festivals set venue = 'Expo Centre, Nasrec, Johannesburg' where slug = 'ultra-south-africa' and venue is null;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-14', '2027-08-14', false
from public.festivals f where f.slug = 'street-parade'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-04-30', '2027-05-01', true
from public.festivals f where f.slug = 'mayday'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-02-26', '2027-02-27', false
from public.festivals f where f.slug = 'reverze'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-05-29', '2027-05-29', false
from public.festivals f where f.slug = 'field-day'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-02', '2027-07-04', true
from public.festivals f where f.slug = 'main-square-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-11-02', '2026-11-08', true
from public.festivals f where f.slug = 'pitchfork-music-festival-paris'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-12-02', '2026-12-06', true
from public.festivals f where f.slug = 'les-rencontres-trans-musicales-de-rennes'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-05-14', '2027-05-16', false
from public.festivals f where f.slug = 'papillons-de-nuit'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-06-25', '2027-07-10', false
from public.festivals f where f.slug = 'jazz-a-vienne'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-19', '2027-08-22', false
from public.festivals f where f.slug = 'festival-cabaret-vert'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-05-14', '2027-05-16', false
from public.festivals f where f.slug = 'art-rock'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-30', '2027-08-08', false
from public.festivals f where f.slug = 'festival-interceltique-de-lorient'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-03-10', '2027-03-13', false
from public.festivals f where f.slug = 'la-route-du-rock-collection-hiver'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-04-20', '2027-04-25', false
from public.festivals f where f.slug = 'printemps-de-bourges'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-05', '2027-08-07', false
from public.festivals f where f.slug = 'let-it-roll'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-10-29', '2026-11-01', false
from public.festivals f where f.slug = 'club-to-club'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-13', '2027-08-15', false
from public.festivals f where f.slug = 'flow-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-08', '2027-07-10', false
from public.festivals f where f.slug = 'pohoda-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-11', '2027-08-14', false
from public.festivals f where f.slug = 'ya-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-29', '2027-08-01', false
from public.festivals f where f.slug = 'arenal-sound'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-07', '2027-07-10', false
from public.festivals f where f.slug = 'festival-cruilla'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-06-23', '2027-06-26', true
from public.festivals f where f.slug = 'tons-of-rock'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-12-03', '2026-12-07', false
from public.festivals f where f.slug = 'wonderfruit'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2026-12-28', '2027-01-01', true
from public.festivals f where f.slug = 'lost-paradise'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-01-01', '2027-01-01', true
from public.festivals f where f.slug = 'field-day-sydney'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-10-30', '2026-10-31', false
from public.festivals f where f.slug = 'escape-halloween'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2026-12-31', '2027-01-01', false
from public.festivals f where f.slug = 'countdown-nye'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-03-12', '2027-03-14', false
from public.festivals f where f.slug = 'lollapalooza-argentina'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-05-15', '2027-05-15', false
from public.festivals f where f.slug = 'harmony-of-hardcore'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-01-22', '2027-01-23', true
from public.festivals f where f.slug = 'let-it-roll-winter'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-18', '2027-07-25', false
from public.festivals f where f.slug = 'boom-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-11-20', '2026-11-21', true
from public.festivals f where f.slug = 'dreamstate-socal'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-10-10', '2026-10-11', true
from public.festivals f where f.slug = 'edc-colombia'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-01-26', '2027-01-31', false
from public.festivals f where f.slug = 'edsea'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-23', '2027-07-26', false
from public.festivals f where f.slug = 'shambhala-music-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-23', '2027-08-03', false
from public.festivals f where f.slug = 'o-z-o-r-a-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-30', '2027-08-01', false
from public.festivals f where f.slug = 'sunrise-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

-- ---- 3. artists + lineups ----

insert into public.artists (name)
select v.name from (values ('Jean-Michel Jarre'), ('Armin van Buuren b2b Benwal'), ('Kittin & The Hacker'), ('Max Cooper'), ('Oscar Mulero'), ('Hysta b2b Korsakoff'), ('Warface b2b Samuel Moriero'), ('Slaughterhouse'), ('Creeds b2b Vortek''s'), ('EargasmGod b2b L.ZWO'), ('Toxic Machinery b2b Kruelty'), ('DJ Caline'), ('Gonzi'), ('Uphoria'), ('Aureb'), ('Infected Mushroom'), ('Pawlowski b2b The Rocketman'), ('The Bloody Beetroots'), ('Graphyt'), ('Ecraze'), ('Lola Cerise'), ('Riana Holley'), ('Annie'), ('Zadix'), ('Zozzz'), ('Bruno Martini'), ('Faithless Sound System'), ('Rotterdam Terror Corps'), ('Die Gebrüder Brett'), ('Cheeva'), ('D-Ceptor'), ('Dr Donk b2b Dikke Baap'), ('Dropixx'), ('H! Dude'), ('Lexxy Chainz'), ('Santino Zervos'), ('Yoshiko b2b Pinotello'), ('Axwell b2b Sebastian Ingrosso'), ('Eli & Fur'), ('Tye Turner'), ('2charm'), ('2LUBLY'), ('Afrodisiac'), ('After'), ('AKEYLAH'), ('Arielle Free'), ('Baby Oliv'), ('bellxsxs'), ('Bryson Hill'), ('Carla Martinez'), ('Club Angel'), ('CRŸBABY'), ('DART'), ('Dean Turnley'), ('DELULU'), ('Disco Lines'), ('DJ PGZ'), ('Eva Charley'), ('Faster Horses'), ('Jackie Hollander'), ('Jamback'), ('Jordan Brando b2b Luuk Van Dijk'), ('The Jungle Giants'), ('JUPiTA b2b bbsanii'), ('Kiara Friend'), ('Kyle Starkey'), ('Lex'), ('Lexï'), ('Love, Jess'), ('Mella Dee'), ('Nice Girl'), ('Oppidan'), ('oskar med k'), ('Playlunch'), ('Renaessance'), ('Riordan'), ('Robert Baxter'), ('Rum Jungle'), ('Saint Ludo'), ('salute'), ('Soul Mass Transit System'), ('Su Yen'), ('THC'), ('Tiff Cornish'), ('Tommy Holohan'), ('TWOFACED'), ('VANNA'), ('The Veronicas'), ('Waxx Off'), ('WOLTERS'), ('WVCHWY'), ('X & Ivy'), ('Yikes'), ('Andrew Bayer'), ('Anabel Englund'), ('CID'), ('DJ Susan'), ('Max Low'), ('Mitis'), ('Sam Feldt'), ('Tom Higgenson'), ('Travis Clark'), ('Trivecta'), ('Amy Wiles'), ('Bella Renee'), ('Linney'), ('Luci'), ('Maxinne'), ('me n ü'), ('Raecola'), ('Sarah de Warren'), ('WHIPPED CREAM'), ('Ciaran McAuley'), ('Alex M.O.R.P.H.'), ('Dash Berlin'), ('Aly & Fila b2b John O''Callaghan'), ('Bicep'), ('Basement Jaxx'), ('Gaskin'), ('bullet tooth'), ('Ellia Jaya'), ('Jess Iszatt'), ('Sasha GiGi'), ('Abhir'), ('Acidheaven'), ('ADÉLA'), ('Aeronave Adolescente'), ('Akriila'), ('Alcalá Norte'), ('Alemeda'), ('Alèrgiques Al Pol·len'), ('Alex Vs Alex'), ('Andy Stott'), ('Angine de Poitrine'), ('ANOHNI'), ('Arca'), ('Atlas Sound'), ('Axolotes Mexicanos'), ('Bae Bae'), ('Blackhaine'), ('Blanco Palamera'), ('Blaya'), ('Bleachers'), ('Bonnie "Prince" Billy'), ('B0YG1RL'), ('Boy Harsher'), ('Brutalismus 3000 b2b ISOxo'), ('Carlos De Jacoba & Ciutat'), ('Carmen Villain'), ('Carré'), ('Castle Rat'), ('Friko'), ('Converge'), ('Dame Area'), ('Dani Dicostas'), ('Decoder'), ('DIIV'), ('Dinosaur Jr.'), ('DJ Fra'), ('DJ /rupture'), ('DJ Zero'), ('DNGDNGDNG & PHRAN'), ('Doechii'), ('Don Caballero'), ('Dove Ellis'), ('Dulce'), ('ear'), ('Eden Aurelius'), ('El Buen Hijo'), ('English Teacher'), ('Erin LeCount'), ('Fades'), ('Full of Hell'), ('Gazella'), ('Gilla Band'), ('Greg Freeman'), ('Guillem Gisbert'), ('Haute & Freddy'), ('Have a Nice Life'), ('Hayley Williams'), ('Headache'), ('Hearts2Hearts'), ('Ibrahim Alfa Jr'), ('Irenegarry'), ('Isaiah Rashad'), ('Jesu'), ('JT'), ('Juana Molina'), ('Julien Baker'), ('Jump Source'), ('Kelsey Lu'), ('Kim Petras'), ('King Gizzard & the Lizard Wizard'), ('Klara Lewis'), ('Lip Critic'), ('Lola Young'), ('Loradeniz'), ('Los Punsetes'), ('Lux Lisbon'), ('Mabe Fratti'), ('Madra Salach'), ('Malibu'), ('Mark Fell & Rp Boo'), ('Marta Salogni'), ('Memory Palace'), ('Metrika'), ('Metronomy'), ('Mike Servito'), ('Mishima'), ('Mori'), ('MUNA'), ('MUSHKA'), ('Naone'), ('Napa'), ('Oceanic'), ('Pablopablo'), ('Pavement'), ('Perfecto Miserable'), ('Phoebe Bridgers'), ('Picture'), ('PISS'), ('Pole'), ('Polygonia'), ('Prostitute'), ('Racing Mount Pleasant'), ('REBE'), ('Robyn'), ('Roly Porter'), ('Santiago Motorizado'), ('S.A.S.S.'), ('Simian Mobile Disco'), ('Skrillex b2b Ninajirachi'), ('Snow Strippers'), ('Sonido Underground'), ('Sophia Stel'), ('Tayana Jane'), ('The Chemical Brothers'), ('Tinashe'), ('Tirzah'), ('TISSFU'), ('Tracey'), ('Tristáni'), ('Twisted Teens'), ('Underscores'), ('Vashti Bunyan'), ('Verushka'), ('Victoryland'), ('Viva Belgrado'), ('Wallows'), ('Warning'), ('Weyes Blood'), ('Tame Impala'), ('Kacey Musgraves'), ('Emma Sehested Høeg'), ('Karpe'), ('Kundo'), ('Lambrini Girls'), ('Neurosis'), ('Patti Smith Quartet'), ('Suki Waterhouse'), ('454'), ('Drain'), ('G Jones b2b Eprom'), ('James K'), ('Konvent'), ('Nu Jazz'), ('RAYE'), ('Iceage'), ('Nirosta Steel'), ('Bassvictim'), ('George Daniel'), ('Nikki Nair'), ('Dylan Dylan'), ('Lido Pimienta'), ('Shadi'), ('Goupile'), ('HatiHati'), ('Blasslila'), ('Cinae'), ('Iris2000'), ('Tris & the Soap Horrifique'), ('Mötley Crüe'), ('Judas Priest'), ('Lynyrd Skynyrd'), ('Amon Amarth'), ('Satyricon'), ('Kreator'), ('Watain'), ('GWAR'), ('Sam Alfred'), ('Joe Hunt'), ('Disco Dora'), ('Tanzer'), ('A Little Sound'), ('Rova'), ('Eskei83'), ('Anaïs'), ('Circadian'), ('Pirapus'), ('Enei'), ('Magnetude'), ('Skrimor'), ('Noisia'), ('IMANU'), ('QZB'), ('Rido'), ('Prolix'), ('Pythius'), ('4 Strings (Classics Set)'), ('Above & Beyond (Anjunabeats Classics)'), ('Allen Watts + Talla 2Xlc'), ('Alpha 9 + Ilan Bluestone'), ('Aly & Fila + Billy Gillies'), ('Andrew Rayel Pres Extasia'), ('Andy Moor'), ('Animato'), ('Barakuda'), ('BT + Matt Fax'), ('Cold Blue'), ('Ferry Corsten + Marsh'), ('John 00 Fleming'), ('Marco V'), ('Paul Van Dyk Pres Essence Of Acid'), ('Solarstone'), ('Warp Brothers'), ('Maximizer'), ('Perfect Stranger'), ('Afrojack B2B Green Velvet'), ('Kuroo'), ('Pablo Romero'), ('Pachanga Boys')) as v(name)
where not exists (select 1 from public.artists a where lower(a.name) = lower(v.name));

insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Jean-Michel Jarre', 0), ('Armin van Buuren b2b Benwal', 1), ('David Guetta', 2), ('Skepta', 3), ('Eric Prydz', 4), ('Amelie Lens', 5), ('Adam Beyer', 6), ('Ben Klock', 7), ('Adriatique', 8), ('Âme', 9), ('DJ Stingray 313', 10), ('HAAi', 11), ('Kerri Chandler', 12), ('Paul Kalkbrenner', 13), ('Scooter', 14), ('Todd Terry', 15), ('Maceo Plex', 16), ('Jeff Mills', 17), ('The Blessed Madonna', 18), ('Sammy Virji', 19), ('Avalon Emerson', 20), ('Octo Octa', 21), ('Miss Monique', 22), ('Kittin & The Hacker', 23), ('Max Cooper', 24), ('Mochakk', 25), ('DVS1', 26), ('I Hate Models', 27), ('Marcel Dettmann', 28), ('Helena Hauff', 29), ('Joseph Capriati', 30), ('Nico Moreno', 31), ('Dave Clarke', 32), ('Oscar Mulero', 33), ('Shanti Celeste', 34), ('The Martinez Brothers', 35), ('San Holo', 36), ('Joris Voorn', 37), ('Eris Drew', 38), ('Folamour', 39), ('FJAAK', 40), ('Job Jobse', 41)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'amsterdam-dance-event' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'amsterdam-dance-event' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Angerfist', 0), ('Da Tweekaz', 1), ('Dr. Peacock', 2), ('Dual Damage', 3), ('Hysta b2b Korsakoff', 4), ('Rebelion', 5), ('Warface b2b Samuel Moriero', 6), ('Slaughterhouse', 7), ('TNT', 8), ('Lil Texas', 9), ('Dimitri K', 10), ('Todiefor', 11), ('Novah', 12), ('Alignment', 13), ('Creeds b2b Vortek''s', 14), ('Dyen', 15), ('Eczodia', 16), ('Omaks', 17), ('EargasmGod b2b L.ZWO', 18), ('Marion Di Napoli', 19), ('Matrakk', 20), ('Prada2000', 21), ('Toxic Machinery b2b Kruelty', 22), ('Eskha', 23), ('DJ Caline', 24), ('Gonzi', 25), ('Uphoria', 26), ('Shoshana', 27), ('Aureb', 28), ('Vini Vici', 29), ('Mandragora', 30), ('Perceval', 31), ('Infected Mushroom', 32), ('Part Time Killer', 33), ('Cara Elizabeth', 34), ('Fenrick', 35), ('Biianco', 36), ('GRAViiTY', 37), ('Pawlowski b2b The Rocketman', 38), ('Roland Cristal', 39), ('Pendulum', 40), ('Netsky', 41), ('Don Diablo', 42), ('Andromedik', 43), ('Dirtyphonics', 44), ('Flux Pavilion', 45), ('Modestep', 46), ('The Bloody Beetroots', 47), ('Graphyt', 48), ('Ecraze', 49), ('DJ Schnake', 50), ('Urumi', 51), ('Lola Cerise', 52), ('Riana Holley', 53), ('Annie', 54), ('Zadix', 55), ('Zozzz', 56)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'dream-nation' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'dream-nation' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Calvin Harris', 0), ('Boris Brejcha', 1), ('Charlotte de Witte', 2), ('FISHER', 3), ('Hardwell', 4), ('Hugel', 5), ('Bruno Martini', 6), ('The Blessed Madonna', 7), ('Don Diablo', 8), ('Jonas Blue', 9), ('Kölsch', 10), ('Anfisa Letyago', 11), ('Enrico Sangiuliano', 12), ('Loud Luxury', 13), ('Âme', 14), ('Faithless Sound System', 15)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'creamfields-chile' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'creamfields-chile' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Da Tweekaz', 0), ('Anime', 1), ('D-Sturb', 2), ('Radical Redemption', 3), ('Rotterdam Terror Corps', 4), ('Die Gebrüder Brett', 5), ('Ally', 6), ('Cheeva', 7), ('D-Ceptor', 8), ('Deezl', 9), ('Dr Donk b2b Dikke Baap', 10), ('Dropixx', 11), ('H! Dude', 12), ('Hysta', 13), ('Jazzy', 14), ('Lexxy Chainz', 15), ('Mish', 16), ('Miss K8 b2b Mad Dog', 17), ('Nikolina', 18), ('Riot Shift', 19), ('Santino Zervos', 20), ('The Dark Horror', 21), ('The Smiler', 22), ('The Straikerz', 23), ('Dr. Peacock', 24), ('Yoshiko b2b Pinotello', 25)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'toxicator' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'toxicator' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Axwell b2b Sebastian Ingrosso', 0), ('R3HAB', 1), ('Afrojack', 2), ('Lilly Palmer', 3), ('Dimitri Vegas', 4), ('Alok', 5), ('Dimension', 6), ('Maddix', 7), ('Cosmic Gate', 8), ('Eli & Fur', 9), ('Marlo', 10), ('Tye Turner', 11), ('Billy Gillies', 12)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'djakarta-warehouse-project' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'djakarta-warehouse-project' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('2charm', 0), ('2LUBLY', 1), ('Afrodisiac', 2), ('After', 3), ('AKEYLAH', 4), ('Anetha', 5), ('Arielle Free', 6), ('Armand Van Helden', 7), ('Baby Oliv', 8), ('bellxsxs', 9), ('Benwal', 10), ('Biianco', 11), ('Black Eyed Peas', 12), ('Boys Noize', 13), ('Bryson Hill', 14), ('Carla Martinez', 15), ('Club Angel', 16), ('CRŸBABY', 17), ('DART', 18), ('Dean Turnley', 19), ('DELULU', 20), ('Disco Lines', 21), ('DJ PGZ', 22), ('Eva Charley', 23), ('Ewan McVicar', 24), ('Faster Horses', 25), ('Frost Children', 26), ('Funk Tribu', 27), ('Hamdi', 28), ('Hannah Laing', 29), ('Helena Lauwaert', 30), ('Jackie Hollander', 31), ('Jamback', 32), ('Jayda G', 33), ('Job Jobse', 34), ('John Summit', 35), ('Jordan Brando b2b Luuk Van Dijk', 36), ('The Jungle Giants', 37), ('JUPiTA b2b bbsanii', 38), ('Kiara Friend', 39), ('KI/KI', 40), ('Kyle Starkey', 41), ('Layton Giordani', 42), ('Lex', 43), ('Lexï', 44), ('Love, Jess', 45), ('Mella Dee', 46), ('Mia Koden', 47), ('MPH', 48), ('Nia Archives', 49), ('Nice Girl', 50), ('nimino', 51), ('Ocean Alley', 52), ('Odd Mob', 53), ('Oppidan', 54), ('oskar med k', 55), ('Overmono', 56), ('Playlunch', 57), ('Renaessance', 58), ('Riordan', 59), ('Robert Baxter', 60), ('Rossi.', 61), ('Rum Jungle', 62), ('Saint Ludo', 63), ('salute', 64), ('Skepta', 65), ('Soul Mass Transit System', 66), ('Southstar', 67), ('SPFDJ', 68), ('Su Yen', 69), ('THC', 70), ('Tiff Cornish', 71), ('Tommy Holohan', 72), ('TWOFACED', 73), ('VANNA', 74), ('The Veronicas', 75), ('Vince Staples', 76), ('Waxx Off', 77), ('WOLTERS', 78), ('WVCHWY', 79), ('X & Ivy', 80), ('Yikes', 81)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'beyond-the-valley' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'beyond-the-valley' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Adam Beyer', 0), ('BUNT.', 1), ('Disco Lines', 2), ('Kettama', 3), ('Eli Brown', 4), ('Andrew Bayer', 5), ('Anabel Englund', 6), ('CID', 7), ('DJ Susan', 8), ('Ely Oaks', 9), ('Max Low', 10), ('Mitis', 11), ('Sam Feldt', 12), ('Tom Higgenson', 13), ('Travis Clark', 14), ('Trivecta', 15), ('Amy Wiles', 16), ('Bella Renee', 17), ('Jackie Hollander', 18), ('Linney', 19), ('Luci', 20), ('Maxinne', 21), ('me n ü', 22), ('Nifra', 23), ('Raecola', 24), ('Sarah de Warren', 25), ('WHIPPED CREAM', 26)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'groove-cruise' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'groove-cruise' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Armin van Buuren', 0), ('Billy Gillies', 1), ('Ciaran McAuley', 2), ('Ørjan Nilsen', 3), ('Ben Gold', 4), ('David Forbes', 5), ('Alex M.O.R.P.H.', 6), ('Richard Durand', 7), ('Dash Berlin', 8), ('Aly & Fila b2b John O''Callaghan', 9), ('Ruben de Ronde', 10)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'a-state-of-trance' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'a-state-of-trance' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Bicep', 0), ('Fatboy Slim', 1), ('2manydjs', 2), ('Andy C', 3), ('Basement Jaxx', 4), ('East End Dubs', 5), ('Ewan McVicar', 6), ('Gaskin', 7), ('Groove Armada', 8), ('Rossi.', 9), ('Skream', 10), ('Wilkinson', 11), ('Arielle Free', 12), ('bullet tooth', 13), ('Ellia Jaya', 14), ('Fish56Octagon', 15), ('Jess Iszatt', 16), ('Sasha GiGi', 17), ('Olive F', 18)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'snowbombing' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'snowbombing' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Abhir', 0), ('Acidheaven', 1), ('ADÉLA', 2), ('Aeronave Adolescente', 3), ('Akriila', 4), ('Alcalá Norte', 5), ('Alemeda', 6), ('Alèrgiques Al Pol·len', 7), ('Alex Vs Alex', 8), ('Andy Stott', 9), ('Angine de Poitrine', 10), ('ANOHNI', 11), ('Arca', 12), ('Atlas Sound', 13), ('Axolotes Mexicanos', 14), ('Bad Gyal', 15), ('Bae Bae', 16), ('BASHKKA', 17), ('Bicep', 18), ('Blackhaine', 19), ('Blanco Palamera', 20), ('Blaya', 21), ('Bleachers', 22), ('Bonnie "Prince" Billy', 23), ('B0YG1RL', 24), ('Boy Harsher', 25), ('Brutalismus 3000 b2b ISOxo', 26), ('Carlos De Jacoba & Ciutat', 27), ('Carmen Villain', 28), ('Caroline Polachek', 29), ('Carré', 30), ('Castle Rat', 31), ('Friko', 32), ('CHVRCHES', 33), ('Converge', 34), ('Dame Area', 35), ('Dani Dicostas', 36), ('Decoder', 37), ('DIIV', 38), ('Dinosaur Jr.', 39), ('Dixon', 40), ('DJ Fra', 41), ('DJ /rupture', 42), ('DJ Stingray 313', 43), ('DJ Zero', 44), ('DNGDNGDNG & PHRAN', 45), ('Doechii', 46), ('Don Caballero', 47), ('Dove Ellis', 48), ('Dulce', 49), ('ear', 50), ('Eden Aurelius', 51), ('El Buen Hijo', 52), ('English Teacher', 53), ('Erin LeCount', 54), ('Esdeekid', 55), ('Fades', 56), ('FKA Twigs', 57), ('Fontaines D.C.', 58), ('Four Tet', 59), ('Full of Hell', 60), ('Gazella', 61), ('Gilla Band', 62), ('Greg Freeman', 63), ('Guillem Gisbert', 64), ('Haute & Freddy', 65), ('Have a Nice Life', 66), ('Hayley Williams', 67), ('Headache', 68), ('Hearts2Hearts', 69), ('Ibrahim Alfa Jr', 70), ('Irenegarry', 71), ('Isaiah Rashad', 72), ('Jersey', 73), ('Jesu', 74), ('John Talabot', 75), ('Joy Orbison', 76), ('JT', 77), ('Juana Molina', 78), ('Julien Baker', 79), ('Jump Source', 80), ('Kelsey Lu', 81), ('Kim Petras', 82), ('King Gizzard & the Lizard Wizard', 83), ('Klara Lewis', 84), ('Konduku', 85), ('Lip Critic', 86), ('livwutang', 87), ('Lola Young', 88), ('Loradeniz', 89), ('Los Punsetes', 90), ('Lux Lisbon', 91), ('Mabe Fratti', 92), ('mad miran', 93), ('Madra Salach', 94), ('Malibu', 95), ('Mark Fell & Rp Boo', 96), ('Marta Salogni', 97), ('Massive Attack', 98), ('Memory Palace', 99), ('Metrika', 100), ('Metronomy', 101), ('Mike Servito', 102), ('Mishima', 103), ('Mori', 104), ('MUNA', 105), ('MUSHKA', 106), ('Naone', 107), ('Napa', 108), ('Oceanic', 109), ('Pablopablo', 110), ('Pavement', 111), ('Perfecto Miserable', 112), ('Phoebe Bridgers', 113), ('Picture', 114), ('PISS', 115), ('PLO Man', 116), ('Pole', 117), ('Polygonia', 118), ('Prospa', 119), ('Prostitute', 120), ('Racing Mount Pleasant', 121), ('REBE', 122), ('Richie Hawtin', 123), ('Robyn', 124), ('Roly Porter', 125), ('Santiago Motorizado', 126), ('S.A.S.S.', 127), ('Shygirl', 128), ('Simian Mobile Disco', 129), ('Skrillex b2b Ninajirachi', 130), ('Snow Strippers', 131), ('Sonido Underground', 132), ('Sophia Stel', 133), ('Tayana Jane', 134), ('The Chemical Brothers', 135), ('Theodora', 136), ('Tinashe', 137), ('Tirzah', 138), ('TISSFU', 139), ('Tracey', 140), ('trickpony', 141), ('Tristáni', 142), ('Turnstile', 143), ('Twisted Teens', 144), ('Underscores', 145), ('Underworld', 146), ('Vashti Bunyan', 147), ('Verushka', 148), ('Victoryland', 149), ('Viva Belgrado', 150), ('Wallows', 151), ('Warning', 152), ('Westside Cowboy', 153), ('Weyes Blood', 154)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'primavera-sound' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'primavera-sound' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Tame Impala', 0), ('Caroline Polachek', 1), ('Kacey Musgraves', 2), ('Emma Sehested Høeg', 3), ('Ezra Collective', 4), ('Karpe', 5), ('Kundo', 6), ('Lambrini Girls', 7), ('Neurosis', 8), ('Patti Smith Quartet', 9), ('Suki Waterhouse', 10), ('Underscores', 11), ('454', 12), ('Drain', 13), ('G Jones b2b Eprom', 14), ('James K', 15), ('Konvent', 16), ('Nu Jazz', 17)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'roskilde-festival' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'roskilde-festival' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Tame Impala', 0), ('Sombr', 1), ('The Neighbourhood', 2), ('RAYE', 3), ('Patti Smith Quartet', 4)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'opener-festival' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'opener-festival' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Lost Frequencies', 0), ('Steve Aoki', 1), ('BUNT.', 2), ('Don Diablo', 3)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'parookaville' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'parookaville' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('KlangKuenstler', 0), ('Lilly Palmer', 1), ('Paul Elstak', 2), ('I Hate Models', 3), ('Schrotthagen', 4), ('Speedy J', 5)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'mayday' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'mayday' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Muse', 0), ('David Guetta', 1), ('Sombr', 2)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'main-square-festival' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'main-square-festival' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Headache', 0), ('DIIV', 1), ('Iceage', 2), ('Nirosta Steel', 3), ('Bassvictim', 4), ('George Daniel', 5), ('Nikki Nair', 6), ('Cinthie', 7), ('Dylan Dylan', 8), ('Zorza', 9), ('Lido Pimienta', 10)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'pitchfork-music-festival-paris' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'pitchfork-music-festival-paris' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Teddybear', 0), ('Shadi', 1), ('Goupile', 2), ('HatiHati', 3), ('Blasslila', 4), ('Cinae', 5), ('Iris2000', 6), ('Tris & the Soap Horrifique', 7)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'les-rencontres-trans-musicales-de-rennes' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'les-rencontres-trans-musicales-de-rennes' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Girls In Hawaii', 0)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'la-route-du-rock-collection-hiver' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Mötley Crüe', 0), ('Judas Priest', 1), ('Turnstile', 2), ('Lynyrd Skynyrd', 3), ('Helloween', 4), ('Amon Amarth', 5), ('Satyricon', 6), ('Kreator', 7), ('Watain', 8), ('GWAR', 9)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'tons-of-rock' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'tons-of-rock' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('John Summit', 0), ('Skepta', 1), ('KI/KI', 2), ('Overmono', 3), ('Armand Van Helden', 4), ('Nia Archives', 5), ('Ewan McVicar', 6), ('Sam Alfred', 7), ('Rossi.', 8), ('Partiboi69', 9)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'lost-paradise' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'lost-paradise' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Major Lazer', 0), ('Sub Focus', 1), ('Andy C', 2), ('Boys Noize', 3), ('Elderbrook', 4), ('Hannah Laing', 5), ('Joe Hunt', 6), ('Disco Dora', 7), ('Club Angel', 8), ('Tanzer', 9)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'field-day-sydney' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'field-day-sydney' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Wilkinson', 0), ('Andromedik', 1), ('A Little Sound', 2), ('Rova', 3), ('Eskei83', 4), ('Koven', 5), ('Fox Stevenson', 6), ('Anaïs', 7), ('Subsonic', 8), ('Circadian', 9), ('Pirapus', 10), ('Black Sun Empire', 11), ('Enei', 12), ('Burr Oak', 13), ('Magnetude', 14), ('Skrimor', 15), ('Noisia', 16), ('IMANU', 17), ('QZB', 18), ('Rido', 19), ('Prolix', 20), ('Pythius', 21)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'let-it-roll-winter' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'let-it-roll-winter' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('4 Strings (Classics Set)', 0), ('Aaron Hibell', 1), ('Above & Beyond (Anjunabeats Classics)', 2), ('Ace Ventura', 3), ('Allen Watts + Talla 2Xlc', 4), ('Alpha 9 + Ilan Bluestone', 5), ('Aly & Fila + Billy Gillies', 6), ('Andrew Rayel Pres Extasia', 7), ('Andy Moor', 8), ('Animato', 9), ('ARTBAT', 10), ('Astrix', 11), ('Barakuda', 12), ('BT + Matt Fax', 13), ('Cold Blue', 14), ('Dash Berlin', 15), ('Ferry Corsten + Marsh', 16), ('Infected Mushroom', 17), ('John 00 Fleming', 18), ('Marco V', 19), ('Mauro Picotto', 20), ('Paul Van Dyk Pres Essence Of Acid', 21), ('Reinier Zonneveld', 22), ('Solarstone', 23), ('Vini Vici', 24), ('Warp Brothers', 25), ('Phaxe', 26), ('Maximizer', 27), ('Neelix', 28), ('Perfect Stranger', 29), ('Judge Jules', 30)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'dreamstate-socal' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'dreamstate-socal' and fe.year = 2026;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Above & Beyond', 0), ('Afrojack B2B Green Velvet', 1), ('Alesso', 2), ('Alok', 3), ('Armand Van Helden', 4), ('Armin van Buuren', 5), ('ARTBAT', 6), ('Astrix', 7), ('BLOND:ISH', 8), ('Boris Brejcha', 9), ('CamelPhat', 10), ('Carl Craig', 11), ('Coone', 12), ('Cosmic Gate', 13), ('deadmau5', 14), ('Deorro', 15), ('Goldie', 16), ('Illenium', 17), ('Infected Mushroom', 18), ('Jamie Jones', 19), ('Kaskade', 20), ('Kuroo', 21), ('LP Giobbi', 22), ('Pablo Romero', 23), ('Pachanga Boys', 24), ('Richie Hawtin', 25), ('Showtek', 26)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'edc-colombia' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'edc-colombia' and fe.year = 2026;

