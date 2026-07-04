-- ============================================================
-- 6 festivals discovered via a user's personal festival-review
-- archive (not part of the DJ Mag Top 100). Added so they can be
-- tracked, reviewed and rated like any other catalog entry.
-- ============================================================

insert into public.festivals (name, slug, description, country, city, genres, official_website)
values
  (
    'Rock Werchter', 'rock-werchter',
    'One of the most iconic music festivals in Europe, running since 1975 near Leuven. A diverse lineup mixing rock, pop and electronic music across multiple stages.',
    'BE', 'Werchter', '{rock,pop,electronic}', 'https://www.rockwerchter.be'
  ),
  (
    'Les Plages Électroniques', 'plage-electro',
    'Beachside electronic music festival at the heart of Cannes, running since 2006, with stages including a rooftop at the Palais des Festivals.',
    'FR', 'Cannes', '{house,electronic}', null
  ),
  (
    'Fcknye Festival', 'fcknye-festival',
    'A New Year''s Eve festival concept, spanning both the last day of one year and the first of the next. Techno and hardstyle focused.',
    'BE', 'Brussels', '{techno,hardstyle}', null
  ),
  (
    'Luxembourg Open Air', 'luxembourg-open-air',
    'A young festival launched in 2019, now spanning two weekends (typically May and September) between Esch-sur-Alzette and Luxembourg City.',
    'LU', 'Esch-sur-Alzette', '{edm}', null
  ),
  (
    'Francofolies Esch-sur-Alzette', 'francofolies-esch',
    'The Luxembourg edition (since 2018) of the French Francofolies festival, founded in 1985. A multi-genre lineup with a different music theme each day.',
    'LU', 'Esch-sur-Alzette', '{pop,rock,rap}', null
  ),
  (
    'Decibel Open Air', 'decibel-open-air',
    'An electronic music festival near Florence, running since 2017.',
    'IT', 'Florence', '{electronic}', null
  )
on conflict (slug) do nothing;
