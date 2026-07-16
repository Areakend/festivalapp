-- ============================================================
-- Generated cover art for festivals with no free-licensed real
-- photo available anywhere (Wikimedia Commons checked and came
-- up empty). Abstract gradient + typography, matching the app
-- own share-card theme palette (violet/sunset/ocean/forest) so
-- it reads as an intentional design, not a broken image. Assets
-- live in the repo at assets/generated-covers/<slug>.png and
-- are hotlinked via raw.githubusercontent.com — fully original
-- content, zero copyright concern, unlike a re-hosted press photo.
-- ============================================================

update public.festivals f
set cover_image_url = 'https://raw.githubusercontent.com/Areakend/festivalapp/main/assets/generated-covers/' || f.slug || '.png'
where f.cover_image_url is null
  and f.slug in ('808-festival', 'a-state-of-trance', 'airbeat-one', 'amf', 'amsterdam-dance-event', 'arc', 'ava', 'baum', 'beats-for-love', 'beonix', 'beyond-the-valley', 'beyond-wonderland', 'blacklist', 'brunch-electronik', 'cercle-music-festival', 'chauffer-dans-la-noirceur', 'creamfields-chile', 'creamfields-hong-kong', 'crssd', 'decibel-open-air', 'defected-croatia', 'defected-malta', 'dekmantel', 'dimensions', 'djakarta-warehouse-project', 'dream-nation', 'dream-village', 'dreamfields', 'echelon-festival', 'edc-china', 'edc-mexico', 'edc-orlando', 'edc-thailand', 'electric-mountain-festival', 'elektric-park', 'eskape', 'fcknye-festival', 'beauregard', 'fly-open-air', 'francofolies-la-rochelle', 'francofolies-esch', 'glitch', 'gmo-sonic', 'groove-cruise', 'hard-summer', 'hellfest', 'hideout', 'holy-ship-wrecked', 'houghton', 'iii-points', 'into-the-woods', 'les-ardentes', 'les-deferlantes', 'les-plages-electroniques', 'lmf', 'lost-lands', 'lost-village', 'love-international', 'lovefest', 'loveland', 'luxembourg-open-air', 'medusa', 'movement', 'nameless', 'neon-countdown', 'neopop', 'neversea', 'nibirii', 'oasis', 'ostend-beach-festival', 'outlook-origins', 'panorama', 'parklife', 'pitch-music-arts', 'positiv', 'primer', 'rave-on-snow', 'ravolution', 'rfm-somnii', 's2o-hong-kong', 's2o-bangkok', 's2o-taiwan', 'saga', 'scream-or-dance', 'sea-star', 'siam-songkran', 'sonar', 'sonar-lisboa', 'sonus', 'soundstorm', 'sunset-by-neon', 'terminal-v', 'magic-of-tomorrowland', 'thuishaven', 'together', 'tomorrowland-winter', 'toxicator', 'transmission', 'unseen', 'untold-dubai', 'valhalla', 'veld', 'verknipt', 'vh1-supersonic', 'vision-colour', 'white-party-bangkok', 'woodstoig', 'world-club-dome-malta', 'world-dj-festival');
