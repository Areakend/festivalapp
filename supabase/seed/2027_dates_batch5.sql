-- 2027 dates, confirmed via official sites/reputable regional media, for
-- recently-finished festivals still missing a 2027 edition.

insert into festival_editions (festival_id, year, start_date, end_date)
select f.id, 2027, v.start_date::date, v.end_date::date
from (values
  ('les-vieilles-charrues', '2027-07-15', '2027-07-18'),
  ('lollapalooza-berlin', '2027-07-17', '2027-07-18'),
  ('parookaville', '2027-07-16', '2027-07-18'),
  ('dour-festival', '2027-07-07', '2027-07-11'),
  ('colours-of-ostrava', '2027-07-21', '2027-07-24'),
  ('montreux-jazz-festival', '2027-07-02', '2027-07-17'),
  ('les-deferlantes', '2027-07-09', '2027-07-11'),
  ('nature-one', '2027-07-29', '2027-08-01'),
  ('womad', '2027-07-22', '2027-07-25')
) as v(slug, start_date, end_date)
join festivals f on f.slug = v.slug
on conflict (festival_id, year) do update
  set start_date = excluded.start_date,
      end_date = excluded.end_date;
