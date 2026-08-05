-- ============================================================
-- 29 genuinely new festivals, researched 2026-08-05, chosen to
-- broaden the catalog beyond its existing electronic/rock/pop-heavy,
-- Western-Europe/US-heavy roster (every candidate name+city was
-- checked against the full existing slug list before inclusion, to
-- avoid re-adding something already present under a different
-- spelling).
--
-- Coverage added:
--   Jazz/blues/folk/classical/country (10): Festival International
--     de Jazz de Montréal, Ottawa Bluesfest, Winnipeg Folk Festival,
--     Boots and Hearts (country), Notodden Blues Festival,
--     Copenhagen Jazz Festival, Pori Jazz Festival, Vilnius Jazz
--     Festival, BBC Proms (classical), Cambridge Folk Festival.
--   Eastern Europe (2): Pol'and'Rock Festival, Ostróda Reggae
--     Festival.
--   Latin America (3): Festival Estéreo Picnic, Lollapalooza Chile,
--     Baja Beach Fest (reggaeton).
--   Africa (8): Afro Nation Ghana, Nyege Nyege Festival (Uganda),
--     Blankets & Wine (Kenya), Sauti za Busara (Tanzania), Back to
--     the City Festival (Johannesburg hip-hop), Livespot X Festival
--     (Lagos), Mawazine Festival (Morocco), Gnaoua World Music
--     Festival (Morocco).
--   Middle East (1): Baalbeck International Festival (Lebanon).
--   Asia (5): We The Fest (Jakarta), ZoukOut (Singapore), Rainforest
--     World Music Festival (Malaysia), Hornbill Festival (Nagaland,
--     India), Waterbomb Busan (Korea, K-pop/EDM).
--
-- Following new_festivals_batch1/2.sql's discipline: latitude,
-- longitude, venue, capacity, number_of_stages and first_year are
-- deliberately left null for all of them -- only fields verified via
-- web search were populated. Editions were added only where a
-- genuinely official date is confirmed; the rest (13 festivals) are
-- seeded with metadata only, pending a confirmed date in a follow-up
-- pass.
-- ============================================================



insert into public.festivals (name, slug, description, country, city, genres, official_website)
values
  ('Festival International de Jazz de Montréal', 'montreal-jazz-festival', 'The world''s largest jazz festival, held annually in downtown Montreal with hundreds of indoor and outdoor concerts spanning jazz, blues, and world music.', 'CA', 'Montreal', array['jazz','blues','world'], 'https://montrealjazzfest.com'),
  ('RBC Ottawa Bluesfest', 'ottawa-bluesfest', 'An eleven-day music festival on Ottawa''s LeBreton Flats that grew from a blues showcase into a major multi-genre event spanning blues, rock, and pop.', 'CA', 'Ottawa', array['blues','rock','pop'], 'https://ottawabluesfest.ca'),
  ('Winnipeg Folk Festival', 'winnipeg-folk-festival', 'A renowned Canadian folk festival held at Birds Hill Provincial Park in Manitoba, featuring folk, roots, and world music across multiple stages with camping.', 'CA', 'Winnipeg', array['folk','world','indie'], 'https://www.winnipegfolkfestival.ca'),
  ('Boots and Hearts Music Festival', 'boots-and-hearts', 'Canada''s largest country music and camping festival, held at Burl''s Creek Event Grounds in Oro-Medonte, Ontario.', 'CA', 'Oro-Medonte', array['country'], 'https://bootsandhearts.com'),
  ('Notodden Blues Festival', 'notodden-blues-festival', 'Scandinavia''s largest blues festival, held annually in the small Norwegian town of Notodden since 1988.', 'NO', 'Notodden', array['blues'], 'https://bluesfest.no'),
  ('Copenhagen Jazz Festival', 'copenhagen-jazz-festival', 'One of Europe''s largest jazz festivals, transforming venues, courtyards, and streets across Copenhagen into concert spaces for ten days each July.', 'DK', 'Copenhagen', array['jazz'], 'https://jazz.dk'),
  ('Pori Jazz Festival', 'pori-jazz-festival', 'A long-running Finnish jazz festival held on the banks of the Kokemäenjoki river in Pori, drawing international jazz and crossover acts each July.', 'FI', 'Pori', array['jazz'], 'https://porijazz.fi'),
  ('Pol''and''Rock Festival', 'poland-rock-festival', 'Europe''s largest free, non-commercial rock festival (formerly Przystanek Woodstock), organized by Poland''s Great Orchestra of Christmas Charity and drawing hundreds of thousands of attendees.', 'PL', 'Czaplinek', array['rock','metal','reggae','indie'], 'https://en.polandrockfestival.pl'),
  ('Ostróda Reggae Festival', 'ostroda-reggae-festival', 'Poland''s premier reggae festival, held on the shores of Lake Drwęckie in Ostróda featuring international and Polish reggae, dancehall, and dub artists.', 'PL', 'Ostróda', array['reggae'], 'https://www.ostrodareggae.com'),
  ('Vilnius Jazz Festival', 'vilnius-jazz-festival', 'Lithuania''s oldest annual jazz festival, established in 1987 and known for showcasing avant-garde and free-improvisation jazz alongside international headliners.', 'LT', 'Vilnius', array['jazz'], 'http://www.vilniusjazz.lt'),
  ('Festival Estéreo Picnic', 'festival-estereo-picnic', 'Colombia''s largest alternative music festival, held annually in Bogotá''s Parque Simón Bolívar with a lineup spanning rock, indie, and pop.', 'CO', 'Bogotá', array['rock','indie','pop'], 'https://www.festivalestereopicnic.com'),
  ('Lollapalooza Chile', 'lollapalooza-chile', 'The South American edition of Lollapalooza, held annually in Santiago''s Parque O''Higgins since 2011 as the first Lollapalooza outside the United States.', 'CL', 'Santiago', array['rock','pop','hiphop','edm'], 'https://www.lollapaloozacl.com'),
  ('BBC Proms', 'bbc-proms', 'An eight-week summer season of daily orchestral and classical concerts held mainly at the Royal Albert Hall in London, one of the world''s largest classical music festivals.', 'GB', 'London', array['classical'], 'https://www.bbc.co.uk/proms'),
  ('Gnaoua World Music Festival', 'gnaoua-world-music-festival', 'An annual festival in the Moroccan coastal town of Essaouira that fuses traditional Gnaoua music with jazz, blues, and world music through collaborative fusion sets.', 'MA', 'Essaouira', array['world'], 'https://www.festival-gnaoua.net'),
  ('Cambridge Folk Festival', 'cambridge-folk-festival', 'One of the world''s most respected folk festivals, held at Cherry Hinton Hall Grounds in Cambridge, England since 1965, spanning folk, roots, and world music.', 'GB', 'Cambridge', array['folk','world','indie'], 'https://www.cambridgefolkfestival.co.uk'),
  ('Afro Nation Ghana', 'afro-nation-ghana', 'Beachfront Afrobeats festival in Accra bringing together the genre''s biggest stars for Ghana''s December "Detty December" season, alongside amapiano and hip-hop acts.', 'GH', 'Accra', array['afrobeats','amapiano','hiphop'], 'https://afronationghana.com'),
  ('Nyege Nyege Festival', 'nyege-nyege-festival', 'Four-day underground electronic and experimental music festival on the banks of the Nile near Jinja, Uganda, spotlighting East African and pan-African club music, DJs and live acts.', 'UG', 'Jinja', array['electronic','techno','experimental','african'], 'https://festival.nyegenyege.com'),
  ('Blankets & Wine', 'blankets-and-wine', 'Long-running open-air day festival in Nairobi showcasing Afrobeats, hip-hop, R&B and live African and global acts, staged across multiple editions per year.', 'KE', 'Nairobi', array['afrobeats','hiphop','rnb'], 'https://kenya.blanketsandwine.com'),
  ('Sauti za Busara', 'sauti-za-busara', 'Pan-African music festival in Zanzibar''s Stone Town, described by the BBC as one of Africa''s best music events, spotlighting traditional and contemporary genres from across the continent and its diaspora.', 'TZ', 'Zanzibar City', array['afrobeat','world','african'], 'https://busaramusic.org'),
  ('Back to the City Festival', 'back-to-the-city-festival', 'Johannesburg''s flagship hip-hop and street-culture festival at Mary Fitzgerald Square, combining live performances, DJ and MC battles, graffiti art and skate culture.', 'ZA', 'Johannesburg', array['hiphop'], 'https://www.backtothecityfestival.com'),
  ('Livespot X Festival', 'livespot-x-festival', 'Lagos-based pan-African concert festival bringing together major Afrobeats, hip-hop and R&B stars alongside international headliners for Nigeria''s December entertainment season.', 'NG', 'Lagos', array['afrobeats','hiphop','rnb'], 'https://livespotnation.com'),
  ('Mawazine Festival', 'mawazine-festival', 'One of the world''s largest free music festivals, held annually in Rabat and Salé with a huge cross-genre lineup of Arab, African and international pop, hip-hop and world-music stars.', 'MA', 'Rabat', array['pop','world','hiphop'], 'https://www.mawazine.ma'),
  ('Baalbeck International Festival', 'baalbeck-international-festival', 'One of the Middle East''s oldest and most prestigious cultural festivals, staging opera, classical and contemporary Lebanese/Arab music performances amid the Roman ruins of Baalbek.', 'LB', 'Baalbek', array['classical','world','arab pop'], 'https://www.baalbeck.org.lb'),
  ('We The Fest', 'we-the-fest', 'Jakarta''s biggest annual festival of pop, indie, hip-hop and electronic music, paired with fashion, art and food, returning in 2026 after a hiatus.', 'ID', 'Jakarta', array['pop','indie','hiphop','electronic'], 'https://www.wethefest.com'),
  ('ZoukOut', 'zoukout', 'Asia''s largest beachfront dance-music festival, held on Singapore''s Sentosa Island with two nights of house, techno, trance and EDM headliners.', 'SG', 'Singapore', array['house','techno','edm','trance'], 'https://zoukgroup.com/zoukout'),
  ('Rainforest World Music Festival', 'rainforest-world-music-festival', 'Long-running world-music festival at the Sarawak Cultural Village in Kuching, Malaysia, pairing daytime music workshops with evening concerts by artists from around the globe.', 'MY', 'Kuching', array['world','folk'], 'https://rwmf.net'),
  ('Hornbill Festival', 'hornbill-festival', 'Nagaland''s ten-day state festival at Kisama Heritage Village bringing together all the state''s tribes for folk performances, a rock contest and modern indie/rock acts.', 'IN', 'Kohima', array['folk','rock','indie'], 'https://tourism.nagaland.gov.in'),
  ('Baja Beach Fest', 'baja-beach-fest', 'The world''s leading reggaeton and Latin-trap beach festival, held on the sands of Rosarito, Mexico with top Latin urban headliners.', 'MX', 'Rosarito', array['reggaeton','latin','latin trap'], 'https://bajabeachfest.com'),
  ('Waterbomb Busan', 'waterbomb-busan', 'Korea''s high-energy summer water-party music festival pairing K-pop idols and EDM/hip-hop acts with large-scale water performances, staged at Lotte World Busan.', 'KR', 'Busan', array['kpop','edm','hiphop','pop'], 'https://www.waterbombfestival.com')
on conflict (slug) do nothing;

insert into public.festival_editions (festival_id, year, start_date, end_date)
select f.id, v.year, v.start_date::date, v.end_date::date
from (values
  ('montreal-jazz-festival', 2027, '2027-06-25', '2027-07-04'),
  ('boots-and-hearts', 2026, '2026-08-07', '2026-08-09'),
  ('pori-jazz-festival', 2027, '2027-07-15', '2027-07-17'),
  ('poland-rock-festival', 2027, '2027-07-29', '2027-07-31'),
  ('ostroda-reggae-festival', 2027, '2027-07-22', '2027-07-25'),
  ('vilnius-jazz-festival', 2026, '2026-10-14', '2026-10-18'),
  ('lollapalooza-chile', 2027, '2027-03-12', '2027-03-14'),
  ('cambridge-folk-festival', 2027, '2027-07-31', '2027-08-01'),
  ('nyege-nyege-festival', 2026, '2026-11-19', '2026-11-22'),
  ('blankets-and-wine', 2026, '2026-09-06', '2026-09-06'),
  ('sauti-za-busara', 2027, '2027-03-19', '2027-03-21'),
  ('back-to-the-city-festival', 2026, '2026-10-10', '2026-10-10'),
  ('baalbeck-international-festival', 2026, '2026-07-25', '2026-08-08'),
  ('hornbill-festival', 2026, '2026-12-01', '2026-12-10'),
  ('baja-beach-fest', 2026, '2026-08-07', '2026-08-09'),
  ('waterbomb-busan', 2026, '2026-08-08', '2026-08-08')
) as v(slug, year, start_date, end_date)
join public.festivals f on f.slug = v.slug
on conflict (festival_id, year) do update
  set start_date = excluded.start_date, end_date = excluded.end_date;

