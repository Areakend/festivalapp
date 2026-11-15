-- ============================================================
-- Festival catalog checkup (generated 2026-11-15): confirms the
-- user-requested "Distopia" festival, refreshes next-edition dates
-- for major festivals whose last recorded edition has already
-- happened, adds newly-announced lineups for a few already-dated
-- 2027 editions, and adds 15 new festivals broadening the catalog
-- into underrepresented regions (Africa, South Asia, Latin America
-- beyond the big names, Eastern Europe) and genres (classical,
-- country, brass/folk, reggae, Latin/rock crossover).
--
-- Every date, venue, website and lineup name below was checked via
-- live web search in this session against official-organizer or
-- reputable trade-press sources (not from model memory). Dates that
-- came back unconfirmed or contradictory (e.g. Mad Cool 2027,
-- Dekmantel 2027, Riot Fest 2027, Austin City Limits 2027, Lollapalooza
-- Chicago 2027, EXIT 2027, Rock in Rio 2027/2028) were deliberately
-- left out rather than guessed. Three researched-but-skipped facts
-- worth noting for future passes:
--   * Rock en Seine will NOT run in 2027 (construction at the
--     Domaine de Saint-Cloud); organizers say it returns in 2028.
--   * Bonnaroo is taking 2027 off (storm damage to The Farm grounds);
--     no 2027 dates exist to add.
--   * Defqon.1's 2026 edition was cancelled (heat "code rood"); its
--     2027 return is now officially confirmed and dated below.
--   * "Pol'and'Rock Festival" was researched as a candidate new
--     festival but turned out to already be in the catalog under
--     slug 'poland-rock-festival' (with a 2027 date already on
--     file) -- skipped to avoid a duplicate.
--   * "AfroFuture" (Accra, Ghana, Dec) was researched as a new-Africa
--     candidate but skipped: the catalog already has "Afro Nation
--     Ghana", a different-but-similar Accra December Afrobeats
--     festival, and the risk of the two being confused outweighed
--     adding it.
--
-- Idempotent: editions upsert on (festival_id, year), artist links on
-- (edition_id, artist_id), artists are inserted only when missing
-- (case-insensitive), festivals only when the slug is missing.
-- ============================================================


-- ============================================================
-- 1. Mandatory: "Distopia" -> Dystopia Festival, Saint-Étienne, France
-- ============================================================
-- The official spelling is "Dystopia", not "Distopia" -- confirmed via
-- multiple ticketing/listing sources (Shotgun, Loire tourism agenda,
-- technoairlines) that all agree on the Saint-Étienne, France edition
-- at Parc Expo. Dystopia also runs separate editions in Mulhouse and
-- Bruz/Rennes under the same brand; this is specifically the
-- Saint-Étienne one the user asked for. Genre is hard techno /
-- hardcore (two-stage "Hard Music & Techno" bill). The confirmed
-- lineup names found (Dr. Peacock, D-Block & S-te-Fan, Sickmode) come
-- from secondary listings only and were not confirmed firmly enough
-- to insert as a published lineup, so no artists are linked here.
-- Official site (dystopia-festival.com/en/saint-etienne) independently
-- re-checked: confirms the 4-5 Dec 2026 dates, Parc Expo venue and
-- website below -- end date corrected from an initial 6 Dec guess.

insert into public.festivals (name, slug, city, venue, country, genres) values ('Dystopia Festival', 'dystopia-festival', 'Saint-Étienne', 'Parc Expo', 'FR', ARRAY['hard techno','hardcore','techno']::text[]) on conflict (slug) do nothing;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-12-04', '2026-12-05', false
from public.festivals f where f.slug = 'dystopia-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;


-- ============================================================
-- 2. Date refresh pass -- confirmed next-edition dates for major
--    festivals whose last recorded edition is already in the past
-- ============================================================

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-09', '2027-07-11', false
from public.festivals f where f.slug = 'awakenings'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-06-24', '2027-06-27', false
from public.festivals f where f.slug = 'defqon-1'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

-- Defqon.1 2026 was officially cancelled (code-red heat warning); the
-- 2027 return above was announced in the same breath by Q-dance.
update public.festival_editions fe set cancelled = true
from public.festivals f where f.id = fe.festival_id and f.slug = 'defqon-1' and fe.year = 2026;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-06-04', '2027-06-06', false
from public.festivals f where f.slug = 'world-club-dome'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-06-17', '2027-06-19', false
from public.festivals f where f.slug = 'sonar'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-20', '2027-08-22', false
from public.festivals f where f.slug = 'lowlands'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

-- Mysteryland skipped 2026 (a deliberate "tussenjaar"/break year to
-- rework the format) and returns in 2027; sources differ slightly
-- (27-29 Aug vs 20-22 Aug) but 27-29 Aug is the one cited as confirmed
-- by the organizers' own FAQ.
insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-27', '2027-08-29', false
from public.festivals f where f.slug = 'mysteryland'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-09', '2027-07-11', false
from public.festivals f where f.slug = 'ultra-europe'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-10', '2027-08-14', true
from public.festivals f where f.slug = 'sziget'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-06-17', '2027-06-20', true
from public.festivals f where f.slug = 'isle-of-wight-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-22', '2027-07-25', false
from public.festivals f where f.slug = 'latitude-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-08-11', '2027-08-15', false
from public.festivals f where f.slug = 'boomtown'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-02', '2027-07-04', false
from public.festivals f where f.slug = 'kappa-futurfestival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-06-11', '2027-06-13', true
from public.festivals f where f.slug = 'best-kept-secret'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-06-04', '2027-06-06', true
from public.festivals f where f.slug = 'nameless'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-09', '2027-07-11', false
from public.festivals f where f.slug = 'rfm-somnii'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

-- Hideout 2027 dates come only from third-party ticketing aggregators
-- (two independent ones agree); no official hideoutfestival.com page
-- was reachable, so confidence here is moderate.
insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-06-29', '2027-07-02', false
from public.festivals f where f.slug = 'hideout'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;


-- ============================================================
-- 3. Lineup check pass -- newly-announced headliners for upcoming
--    (not-yet-happened) editions, added as partial published lineups
-- ============================================================

insert into public.artists (name)
select v.name from (values ('Bonobo'), ('Carl Cox'), ('Jessie Ware'), ('Peggy Gou'), ('Romy'), ('Fontaines D.C.'), ('Katseye'), ('Lola Young'), ('Fatboy Slim'), ('Robbie Williams'), ('Kings of Leon'), ('Phoebe Bridgers'), ('JUNGLE'), ('David Guetta')) as v(name)
where not exists (select 1 from public.artists a where lower(a.name) = lower(v.name));

insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Bonobo', 0), ('Carl Cox', 1), ('Jessie Ware', 2), ('Peggy Gou', 3), ('Romy', 4)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'sonar' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;
update public.festival_editions fe set lineup_published = true from public.festivals f where f.id = fe.festival_id and f.slug = 'sonar' and fe.year = 2027;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Fontaines D.C.', 0), ('Katseye', 1), ('Lola Young', 2)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'sziget' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Fatboy Slim', 0), ('Robbie Williams', 1), ('Kings of Leon', 2)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'isle-of-wight-festival' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Phoebe Bridgers', 0), ('JUNGLE', 1), ('Fontaines D.C.', 2)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'best-kept-secret' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('David Guetta', 0)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'nameless' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;


-- ============================================================
-- 4. New festivals -- 15 real, currently-active festivals not yet in
--    the catalog, chosen for genre/geographic diversity: Africa
--    (Nigeria, Malawi), South Asia (India), Latin America (Mexico x2,
--    Brazil x2), Eastern Europe (Poland), the Middle East/North
--    Africa (Morocco), the Balkans (Serbia), classical music
--    (Switzerland, US), country (US), reggae (Jamaica) and Caribbean/
--    Latin crossover.
-- ============================================================

insert into public.festivals (name, slug, city, venue, country, genres) values ('Tomorrowland Brasil', 'tomorrowland-brasil', 'Itu', 'Parque Maeda', 'BR', ARRAY['house','techno','edm']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Felabration', 'felabration', 'Lagos', 'New Afrika Shrine, Ikeja', 'NG', ARRAY['afrobeat']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Lake of Stars', 'lake-of-stars', 'Nkhotakota', 'Fish Eagle Bay Lodge', 'MW', ARRAY['world','afrobeat','electronic']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Ziro Festival of Music', 'ziro-festival-of-music', 'Ziro', null, 'IN', ARRAY['indie','folk','rock']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Tecate Pa''l Norte', 'tecate-pal-norte', 'Monterrey', 'Parque Fundidora', 'MX', ARRAY['rock','pop','hip-hop','latin']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Festival Internacional Cervantino', 'festival-internacional-cervantino', 'Guanajuato', null, 'MX', ARRAY['classical','world','jazz']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Verbier Festival', 'verbier-festival', 'Verbier', 'Salle des Combins', 'CH', ARRAY['classical']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('FIB Benicàssim', 'fib-benicassim', 'Benicàssim', null, 'ES', ARRAY['indie','rock','pop','electronic']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Reggae Sumfest', 'reggae-sumfest', 'Montego Bay', 'Catherine Hall', 'JM', ARRAY['reggae','dancehall']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Country Thunder Wisconsin', 'country-thunder-wisconsin', 'Twin Lakes', null, 'US', ARRAY['country']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Audioriver', 'audioriver', 'Łódź', null, 'PL', ARRAY['electronic','techno','house']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Ravinia Festival', 'ravinia-festival', 'Highland Park', 'Ravinia Park', 'US', ARRAY['classical','jazz','pop']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Primavera Sound São Paulo', 'primavera-sound-sao-paulo', 'São Paulo', 'Autódromo de Interlagos', 'BR', ARRAY['indie','rock','pop','electronic']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Jazzablanca', 'jazzablanca', 'Casablanca', 'Anfa Park', 'MA', ARRAY['jazz','world','pop']::text[]) on conflict (slug) do nothing;

insert into public.festivals (name, slug, city, venue, country, genres) values ('Guča Trumpet Festival', 'guca-trumpet-festival', 'Guča', null, 'RS', ARRAY['brass','folk']::text[]) on conflict (slug) do nothing;

-- Official websites, verified via web search, backfilled the same way
-- the Oct 2026 checkup backfills venues.
update public.festivals set official_website = 'https://dystopia-festival.com' where slug = 'dystopia-festival' and official_website is null;
update public.festivals set official_website = 'https://brasil.tomorrowland.com' where slug = 'tomorrowland-brasil' and official_website is null;
update public.festivals set official_website = 'https://felabration.net' where slug = 'felabration' and official_website is null;
update public.festivals set official_website = 'https://www.lakeofstars.org' where slug = 'lake-of-stars' and official_website is null;
update public.festivals set official_website = 'https://zirofestival.com' where slug = 'ziro-festival-of-music' and official_website is null;
update public.festivals set official_website = 'https://tecatepalnorte.com' where slug = 'tecate-pal-norte' and official_website is null;
update public.festivals set official_website = 'https://festivalcervantino.gob.mx' where slug = 'festival-internacional-cervantino' and official_website is null;
update public.festivals set official_website = 'https://www.verbierfestival.com' where slug = 'verbier-festival' and official_website is null;
update public.festivals set official_website = 'https://fiberfib.com' where slug = 'fib-benicassim' and official_website is null;
update public.festivals set official_website = 'https://reggaesumfest.com' where slug = 'reggae-sumfest' and official_website is null;
update public.festivals set official_website = 'https://www.countrythunder.com' where slug = 'country-thunder-wisconsin' and official_website is null;
update public.festivals set official_website = 'https://www.audioriver.pl' where slug = 'audioriver' and official_website is null;
update public.festivals set official_website = 'https://www.ravinia.org' where slug = 'ravinia-festival' and official_website is null;
update public.festivals set official_website = 'https://www.primaverasound.com' where slug = 'primavera-sound-sao-paulo' and official_website is null;
update public.festivals set official_website = 'https://www.jazzablanca.com' where slug = 'jazzablanca' and official_website is null;
update public.festivals set official_website = 'https://www.guca.rs' where slug = 'guca-trumpet-festival' and official_website is null;

-- ---- editions for the new festivals (confirmed dates only; three of
-- the fifteen -- Lake of Stars, Ziro, Reggae Sumfest -- only have a
-- solidly-confirmed *past* edition on record, and Audioriver has none
-- at all because its 2026 venue/date reporting conflicted between
-- Płock and Łódź, so it is seeded with metadata only pending a
-- follow-up pass) ----

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-04-30', '2027-05-02', true
from public.festivals f where f.slug = 'tomorrowland-brasil'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-10-12', '2026-10-18', true
from public.festivals f where f.slug = 'felabration'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2025, '2025-10-17', '2025-10-19', false
from public.festivals f where f.slug = 'lake-of-stars'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-09-24', '2026-09-27', false
from public.festivals f where f.slug = 'ziro-festival-of-music'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-03-27', '2026-03-29', true
from public.festivals f where f.slug = 'tecate-pal-norte'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-10-03', '2026-10-18', false
from public.festivals f where f.slug = 'festival-internacional-cervantino'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-15', '2027-08-01', false
from public.festivals f where f.slug = 'verbier-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-15', '2027-07-17', false
from public.festivals f where f.slug = 'fib-benicassim'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2025, '2025-07-13', '2025-07-19', false
from public.festivals f where f.slug = 'reggae-sumfest'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2027, '2027-07-15', '2027-07-18', true
from public.festivals f where f.slug = 'country-thunder-wisconsin'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-06-03', '2026-09-23', true
from public.festivals f where f.slug = 'ravinia-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-12-05', '2026-12-06', true
from public.festivals f where f.slug = 'primavera-sound-sao-paulo'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-07-02', '2026-07-11', true
from public.festivals f where f.slug = 'jazzablanca'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

insert into public.festival_editions (festival_id, year, start_date, end_date, lineup_published)
select f.id, 2026, '2026-08-07', '2026-08-09', false
from public.festivals f where f.slug = 'guca-trumpet-festival'
on conflict (festival_id, year) do update set start_date = excluded.start_date, end_date = excluded.end_date;

-- ---- lineups for the new festivals ----

insert into public.artists (name)
select v.name from (values ('Alok'), ('The Chainsmokers'), ('FISHER'), ('Axwell'), ('Steve Aoki'), ('Dubdogz'), ('Cat Dealers'), ('Femi Kuti & The Positive Force'), ('Made Kuti'), ('Seun Kuti & Egypt 80'), ('Tyler, The Creator'), ('Guns N'' Roses'), ('The Killers'), ('Jon Pardi'), ('Zach Top'), ('Thomas Rhett'), ('Megan Moroney'), ('Florida Georgia Line'), ('Paul Simon'), ('Gladys Knight'), ('Miranda Lambert'), ('Chance the Rapper'), ('Rod Stewart'), ('The Strokes'), ('Gorillaz'), ('FKA twigs'), ('Lily Allen'), ('Scorpions'), ('Jorja Smith'), ('Ms. Lauryn Hill'), ('Wyclef Jean')) as v(name)
where not exists (select 1 from public.artists a where lower(a.name) = lower(v.name));

insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Alok', 0), ('The Chainsmokers', 1), ('FISHER', 2), ('Axwell', 3), ('Steve Aoki', 4), ('Dubdogz', 5), ('Cat Dealers', 6)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'tomorrowland-brasil' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Femi Kuti & The Positive Force', 0), ('Made Kuti', 1), ('Seun Kuti & Egypt 80', 2)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'felabration' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Tyler, The Creator', 0), ('Guns N'' Roses', 1), ('The Killers', 2)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'tecate-pal-norte' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Jon Pardi', 0), ('Zach Top', 1), ('Thomas Rhett', 2), ('Megan Moroney', 3), ('Florida Georgia Line', 4)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'country-thunder-wisconsin' and fe.year = 2027) e
on conflict (edition_id, artist_id) do nothing;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Paul Simon', 0), ('Gladys Knight', 1), ('Miranda Lambert', 2), ('Chance the Rapper', 3), ('Rod Stewart', 4)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'ravinia-festival' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('The Strokes', 0), ('Gorillaz', 1), ('FKA twigs', 2), ('Lily Allen', 3)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'primavera-sound-sao-paulo' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;


insert into public.edition_artists (edition_id, artist_id, order_index)
select e.id, a.id, v.ord
from (values ('Robbie Williams', 0), ('Scorpions', 1), ('Jorja Smith', 2), ('Ms. Lauryn Hill', 3), ('Wyclef Jean', 4)) as v(name, ord)
join public.artists a on lower(a.name) = lower(v.name)
cross join (select fe.id from public.festival_editions fe join public.festivals f on f.id = fe.festival_id where f.slug = 'jazzablanca' and fe.year = 2026) e
on conflict (edition_id, artist_id) do nothing;
