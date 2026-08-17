-- 2027 dates, confirmed via official sites only, for recently-finished
-- festivals still missing a 2027 edition. Part of a broader sweep — most
-- of the ~60 festivals checked in this pass have no 2027 announcement yet
-- (expected at ~1 year out), left alone rather than guessed.

insert into festival_editions (festival_id, year, start_date, end_date)
select f.id, 2027, v.start_date::date, v.end_date::date
from (values
  ('summer-breeze-open-air', '2027-08-18', '2027-08-21'),
  ('glitch', '2027-08-11', '2027-08-14'),
  ('loveland', '2027-08-07', '2027-08-08'),
  ('untold', '2027-08-05', '2027-08-08')
) as v(slug, start_date, end_date)
join festivals f on f.slug = v.slug
on conflict (festival_id, year) do update
  set start_date = excluded.start_date,
      end_date = excluded.end_date;
