-- ============================================================
-- Batch 2 of new festival additions: 44 real, currently-active
-- festivals researched via live web search, chosen specifically to
-- broaden the catalog's genre and geographic spread beyond the
-- existing electronic/dance-heavy roster. Every entry was
-- individually cross-checked (name + city) against the full list of
-- ~176 existing slugs in the catalog before inclusion, to catch
-- duplicates hiding under a different slug spelling (e.g. Hellfest,
-- Download Festival, Dour Festival, Rock Werchter and Amsterdam
-- Dance Event were all already present and excluded from this batch).
--
-- Coverage added:
--   Europe (17): UK/German/Austrian/Swedish/Spanish/French/Dutch
--     rock, metal and indie festivals (Reading, Isle of Wight,
--     Pinkpop, Rock am Ring, Wacken, Nova Rock, Sweden Rock,
--     Rototom Sunsplash [reggae], Rock en Seine, Eurockeennes de
--     Belfort, Main Square, North Sea Jazz, Green Man, Latitude,
--     Reeperbahn, Iceland Airwaves, Bloodstock).
--   North America (12): Austin City Limits, Governors Ball, Outside
--     Lands, Shaky Knees, Riot Fest, Louder Than Life, Stagecoach
--     [country], Newport Folk, Osheaga, Sonic Temple, Boston Calling,
--     CMA Fest [country].
--   Latin America (5): Cosquin Rock, Rock al Parque, Lollapalooza
--     Argentina, Lollapalooza Brasil, Corona Capital.
--   Asia-Pacific (7): Summer Sonic, Wonderfruit, Laneway Festival,
--     Bluesfest Byron Bay, Rainbow Spirit Festival [psytrance,
--     formerly Rainbow Serpent], Java Jazz Festival, NH7 Weekender.
--   Middle East / Africa (3): Sole DXB, Afro Nation Portugal, Cape
--     Town International Jazz Festival.
--
-- Deliberately NOT included, and why (researched then rejected
-- rather than silently skipped):
--   - Hangout Music Festival: cancelled for 2026 by the city of Gulf
--     Shores amid a lineup dispute; only unofficial city-source
--     dates exist for a possible 2027 return, not organizer-confirmed.
--   - Firefly Music Festival: no confirmed return since going on
--     hiatus after 2022; status too uncertain to seed.
--   - Life Is Beautiful (Las Vegas): cancelled 2025, no 2026 status
--     announced as of research time.
--   - Falls Festival (AU): ambiguous/contradictory sourcing on
--     whether the 2026 edition is actually proceeding; skipped
--     rather than guess.
--
-- Kept despite being on hiatus/cancelled for their *next* edition,
-- because they are long-running, real, notable franchises (matches
-- the Defqon.1 / Solidays precedent from earlier lots):
--   - Bluesfest Byron Bay: 2026 edition cancelled shortly before the
--     event; no editions row added.
--
-- Lat/long, capacity, number_of_stages, venue and first_year are
-- deliberately omitted for all 44 (left null), same discipline as
-- new_festivals_batch1.sql -- only name/slug/description/country/
-- city/genres/official_website are populated, all of which were
-- verified via web search rather than recalled from memory.
--
-- Editions: today's date is 2026-07-29, so most Northern-Hemisphere
-- summer festivals in this batch already held their 2026 edition
-- earlier in the year by the time this file was written. An
-- editions row was added ONLY where a genuinely confirmed date is
-- still ahead -- either later in 2026 or an already-announced 2027
-- date (Sonic Temple, Boston Calling, Lollapalooza Argentina and
-- Lollapalooza Brasil all had their next edition dates published on
-- their own official sites at research time). Every other festival
-- here intentionally has no editions row rather than a guessed one.
-- ============================================================

insert into festivals (name, slug, description, country, city, genres, official_website)
values
  -- ---------- Europe ----------
  ('Reading Festival', 'reading-festival',
   'One of the UK''s oldest and most storied music festivals, held over the August bank holiday weekend on the banks of the Thames.',
   'GB', 'Reading', array['rock','indie','alternative','pop'], 'https://www.readingfestival.com/'),

  ('Isle of Wight Festival', 'isle-of-wight-festival',
   'A legendary British festival revived in 2002, tracing its name back to the historic late-1960s/1970 events on the island.',
   'GB', 'Newport, Isle of Wight', array['rock','pop','indie'], 'https://isleofwightfestival.com/'),

  ('Pinkpop', 'pinkpop',
   'One of the world''s longest-running annual pop and rock festivals, held at Megaland in the Dutch province of Limburg.',
   'NL', 'Landgraaf', array['rock','pop','indie'], 'https://www.pinkpop.nl/'),

  ('Rock am Ring', 'rock-am-ring',
   'One of Germany''s biggest rock festivals, staged on the Nürburgring motor-racing circuit in the Eifel region.',
   'DE', 'Nürburg', array['rock','metal','hard rock'], 'https://www.rock-am-ring.com/en/'),

  ('Wacken Open Air', 'wacken-open-air',
   'The world''s largest heavy metal festival, transforming the small German village of Wacken into a metal pilgrimage site every summer.',
   'DE', 'Wacken', array['metal','heavy metal','thrash metal'], 'https://www.wacken.com/en/'),

  ('Nova Rock Festival', 'nova-rock-festival',
   'Austria''s largest rock and metal festival, held on the Pannonia Fields near the Hungarian border.',
   'AT', 'Nickelsdorf', array['rock','metal','hard rock'], 'https://www.novarock.at/'),

  ('Sweden Rock Festival', 'sweden-rock-festival',
   'Scandinavia''s premier classic rock, hard rock and metal festival, held on Sweden''s Blekinge coast.',
   'SE', 'Sölvesborg', array['rock','metal','hard rock','blues'], 'https://www.swedenrock.com/'),

  ('Rototom Sunsplash', 'rototom-sunsplash',
   'Europe''s largest reggae festival, a week-long celebration of reggae, dub and ska on Spain''s Mediterranean coast.',
   'ES', 'Benicàssim', array['reggae','dub','ska'], 'https://rototomsunsplash.com/en/'),

  ('Rock en Seine', 'rock-en-seine',
   'A major Parisian rock and indie festival staged in the historic grounds of the Domaine National de Saint-Cloud.',
   'FR', 'Saint-Cloud (Paris)', array['rock','indie','alternative'], 'https://rockenseine.com/'),

  ('Eurockéennes de Belfort', 'eurockeennes-de-belfort',
   'A pioneering French multi-genre rock festival held on the Presqu''île du Malsaucy peninsula near Belfort.',
   'FR', 'Belfort', array['rock','indie','punk','electronic'], 'https://www.eurockeennes.fr/'),

  ('Main Square Festival', 'main-square-festival',
   'A rock, pop and hip-hop festival staged inside the UNESCO-listed Citadelle Vauban in Arras, northern France.',
   'FR', 'Arras', array['rock','pop','hip-hop'], 'https://mainsquarefestival.fr/en/'),

  ('North Sea Jazz Festival', 'north-sea-jazz-festival',
   'One of the world''s largest indoor jazz festivals, held at Rotterdam Ahoy since 2006 after originating in The Hague in 1976.',
   'NL', 'Rotterdam', array['jazz','soul','funk','blues'], 'https://www.northseajazz.com/en/'),

  ('Green Man Festival', 'green-man-festival',
   'An independent music, science and arts festival set in the Brecon Beacons (Bannau Brycheiniog), Wales.',
   'GB', 'Brecon Beacons (Glanusk Park)', array['folk','indie','alternative'], 'https://www.greenman.net/'),

  ('Latitude Festival', 'latitude-festival',
   'A multi-genre festival at Henham Park in Suffolk, pairing indie and pop headliners with comedy, theatre and literature stages.',
   'GB', 'Southwold', array['indie','pop','alternative'], 'https://www.latitudefestival.com/'),

  ('Reeperbahn Festival', 'reeperbahn-festival',
   'Europe''s largest club festival, showcasing new music across roughly 70 venues on Hamburg''s famous Reeperbahn strip.',
   'DE', 'Hamburg', array['indie','alternative','electronic','pop'], 'https://www.reeperbahnfestival.com/en'),

  ('Iceland Airwaves', 'iceland-airwaves',
   'An influential showcase festival spotlighting Icelandic and international indie acts across venues in downtown Reykjavik.',
   'IS', 'Reykjavik', array['indie','electronic','pop'], 'https://icelandairwaves.is/'),

  ('Bloodstock Open Air', 'bloodstock-open-air',
   'The UK''s largest independent heavy metal festival, held at Catton Park in Derbyshire.',
   'GB', 'Walton-on-Trent', array['metal','heavy metal','thrash metal'], 'https://bloodstock.uk.com/'),

  -- ---------- North America ----------
  ('Austin City Limits Music Festival', 'austin-city-limits',
   'A two-weekend Austin institution held in Zilker Park, spun off from the long-running PBS television show of the same name.',
   'US', 'Austin, TX', array['rock','indie','pop','hip-hop'], 'https://www.aclfestival.com/'),

  ('Governors Ball Music Festival', 'governors-ball-music-festival',
   'New York City''s flagship multi-genre summer festival, held in Flushing Meadows Corona Park, Queens.',
   'US', 'Queens, NY', array['pop','hip-hop','indie','electronic'], 'https://www.governorsballmusicfestival.com/'),

  ('Outside Lands', 'outside-lands',
   'A San Francisco festival in Golden Gate Park spanning rock, hip-hop and electronic music alongside food, wine and comedy.',
   'US', 'San Francisco, CA', array['rock','indie','hip-hop','electronic'], 'https://sfoutsidelands.com/'),

  ('Shaky Knees Festival', 'shaky-knees-festival',
   'Atlanta''s premier rock and indie festival, held in Piedmont Park.',
   'US', 'Atlanta, GA', array['rock','indie','alternative','punk'], 'https://www.shakykneesfestival.com/'),

  ('Riot Fest', 'riot-fest',
   'A punk- and alternative-rooted Chicago festival known for full-album sets and reunion shows, held in Douglass Park.',
   'US', 'Chicago, IL', array['punk','rock','alternative'], 'https://riotfest.org/'),

  ('Louder Than Life', 'louder-than-life',
   'America''s largest rock and metal festival, held at the Kentucky Expo Center in Louisville.',
   'US', 'Louisville, KY', array['rock','metal','hard rock'], 'https://louderthanlifefestival.com/'),

  ('Stagecoach Festival', 'stagecoach-festival',
   'The country-music counterpart to Coachella, held at the Empire Polo Club in Indio, California.',
   'US', 'Indio, CA', array['country'], 'https://stagecoachfestival.com/'),

  ('Newport Folk Festival', 'newport-folk-festival',
   'A historic folk festival at Fort Adams State Park, Rhode Island, famous as the site of Bob Dylan''s controversial 1965 electric set.',
   'US', 'Newport, RI', array['folk','americana'], 'https://newportfolk.org/'),

  ('Osheaga Music and Arts Festival', 'osheaga',
   'Montreal''s flagship summer festival, staged on Parc Jean-Drapeau in the middle of the St. Lawrence River.',
   'CA', 'Montreal', array['indie','pop','hip-hop','electronic'], 'https://osheaga.com/en'),

  ('Sonic Temple Art & Music Festival', 'sonic-temple',
   'A major American rock and metal festival held at Historic Crew Stadium in Columbus, Ohio.',
   'US', 'Columbus, OH', array['rock','metal','hard rock'], 'https://sonictemplefestival.com/'),

  ('Boston Calling', 'boston-calling',
   'A multi-genre rock, indie and hip-hop festival held at the Harvard Athletic Complex in Allston, Boston.',
   'US', 'Boston, MA', array['rock','indie','pop','hip-hop'], 'https://www.bostoncalling.com/'),

  ('CMA Fest', 'cma-fest',
   'Country music''s biggest fan festival, taking over downtown Nashville each June, with performer proceeds benefiting music education.',
   'US', 'Nashville, TN', array['country'], 'https://cmafest.com/'),

  -- ---------- Latin America ----------
  ('Cosquín Rock', 'cosquin-rock',
   'Argentina''s leading rock festival, held near Córdoba and now also touring editions in other Latin American countries.',
   'AR', 'Santa María de Punilla (Córdoba)', array['rock','latin','alternative'], 'https://cosquinrock.net/'),

  ('Rock al Parque', 'rock-al-parque',
   'Bogotá''s free, city-government-run rock festival in Parque Simón Bolívar, one of the largest free rock festivals in Latin America.',
   'CO', 'Bogotá', array['rock','punk','metal'], 'https://rockalparque.gov.co/'),

  ('Lollapalooza Argentina', 'lollapalooza-argentina',
   'The Argentine edition of Lollapalooza, held at the Hipódromo de San Isidro in Buenos Aires.',
   'AR', 'Buenos Aires', array['pop','rock','hip-hop','electronic'], 'https://www.lollapaloozaar.com/'),

  ('Lollapalooza Brasil', 'lollapalooza-brasil',
   'The Brazilian edition of Lollapalooza, held at the Autódromo de Interlagos motor-racing circuit in São Paulo.',
   'BR', 'São Paulo', array['pop','rock','hip-hop','electronic'], 'https://www.lollapaloozabr.com/'),

  ('Corona Capital', 'corona-capital',
   'Mexico City''s biggest alternative and indie-rock festival, held at the Autódromo Hermanos Rodríguez.',
   'MX', 'Mexico City', array['rock','indie','alternative','pop'], 'https://www.coronacapital.com.mx/'),

  -- ---------- Asia-Pacific ----------
  ('Summer Sonic', 'summer-sonic',
   'Japan''s dual-city rock and pop festival, held simultaneously across Tokyo and Osaka on the same weekend.',
   'JP', 'Tokyo & Osaka', array['rock','pop','hip-hop','electronic'], 'https://www.summersonic.com/en/'),

  ('Wonderfruit', 'wonderfruit',
   'A boutique arts, music and sustainability festival set on a former farm in Chonburi, Thailand.',
   'TH', 'Chonburi', array['electronic','indie','world'], 'https://wonderfruit.co/'),

  ('Laneway Festival', 'laneway-festival',
   'A touring indie and electronic festival that began in a Melbourne laneway and now spans cities across Australia and New Zealand.',
   'AU', 'Melbourne (touring AU/NZ)', array['indie','pop','electronic'], 'https://lanewayfestival.com/'),

  ('Bluesfest Byron Bay', 'bluesfest-byron-bay',
   'A long-running blues, roots and rock festival in Byron Bay, Australia; the 2026 edition was cancelled due to soft ticket sales.',
   'AU', 'Byron Bay', array['blues','roots','rock'], 'https://www.bluesfest.com.au/'),

  ('Rainbow Spirit Festival', 'rainbow-spirit-festival',
   'A psytrance and electronic festival in Victoria, Australia, formerly known as Rainbow Serpent Festival before a 2023 rebrand.',
   'AU', 'Tallarook, Victoria', array['psytrance','electronic'], 'https://rainbowspirit.net/'),

  ('Java Jazz Festival', 'java-jazz-festival',
   'Southeast Asia''s largest jazz festival, held annually in Jakarta, Indonesia.',
   'ID', 'Jakarta', array['jazz','soul','r&b'], 'https://www.javajazzfestival.com/'),

  ('NH7 Weekender', 'nh7-weekender',
   'India''s touring multi-genre music festival, historically anchored in Pune with satellite city editions.',
   'IN', 'Pune (touring)', array['indie','rock','electronic','hip-hop'], 'https://nh7.in/'),

  -- ---------- Middle East / Africa ----------
  ('Sole DXB', 'sole-dxb',
   'A Dubai festival blending streetwear, hip-hop and R&B culture with live music, held at Dubai Design District.',
   'AE', 'Dubai', array['hip-hop','r&b','streetwear culture'], 'https://sole.digital/'),

  ('Afro Nation Portugal', 'afro-nation-portugal',
   'The flagship edition of the world''s largest Afrobeats, amapiano and dancehall festival, held on the beach at Portimão.',
   'PT', 'Portimão', array['afrobeats','amapiano','dancehall'], 'https://www.afronation.com/'),

  ('Cape Town International Jazz Festival', 'cape-town-jazz-festival',
   'Africa''s largest jazz festival, held at the Cape Town International Convention Centre.',
   'ZA', 'Cape Town', array['jazz'], 'https://capetownjazzfest.com/')
on conflict (slug) do nothing;

-- Editions: only for confirmed dates that are still ahead of today
-- (2026-07-29) -- either later in 2026 or an already-announced 2027
-- date. Every other festival above intentionally has no editions
-- row here (its 2026 edition had already happened, or no future
-- date has been announced yet).
insert into festival_editions (festival_id, year, start_date, end_date)
select f.id, v.year, v.start_date::date, v.end_date::date
from (values
  ('wacken-open-air', 2026, '2026-07-29', '2026-08-01'),
  ('osheaga', 2026, '2026-07-31', '2026-08-02'),
  ('outside-lands', 2026, '2026-08-07', '2026-08-09'),
  ('summer-sonic', 2026, '2026-08-14', '2026-08-16'),
  ('rototom-sunsplash', 2026, '2026-08-16', '2026-08-22'),
  ('green-man-festival', 2026, '2026-08-20', '2026-08-23'),
  ('rock-en-seine', 2026, '2026-08-26', '2026-08-30'),
  ('reading-festival', 2026, '2026-08-27', '2026-08-30'),
  ('bloodstock-open-air', 2026, '2026-08-06', '2026-08-09'),
  ('louder-than-life', 2026, '2026-09-17', '2026-09-20'),
  ('shaky-knees-festival', 2026, '2026-09-18', '2026-09-20'),
  ('riot-fest', 2026, '2026-09-18', '2026-09-20'),
  ('reeperbahn-festival', 2026, '2026-09-16', '2026-09-19'),
  ('austin-city-limits', 2026, '2026-10-02', '2026-10-11'),
  ('rock-al-parque', 2026, '2026-10-10', '2026-10-12'),
  ('iceland-airwaves', 2026, '2026-11-05', '2026-11-07'),
  ('wonderfruit', 2026, '2026-12-03', '2026-12-07'),
  ('sole-dxb', 2026, '2026-12-12', '2026-12-14'),
  ('lollapalooza-argentina', 2027, '2027-03-12', '2027-03-14'),
  ('lollapalooza-brasil', 2027, '2027-03-19', '2027-03-21'),
  ('sonic-temple', 2027, '2027-05-13', '2027-05-16'),
  ('boston-calling', 2027, '2027-06-04', '2027-06-06')
) as v(slug, year, start_date, end_date)
join festivals f on f.slug = v.slug
on conflict (festival_id, year) do nothing;
