-- 2027 dates for Les Plages Electroniques and Sziget, provided directly by
-- the user (not yet showing on official sites at time of the automated
-- research sweep in the previous pass).

insert into festival_editions (festival_id, year, start_date, end_date)
select f.id, 2027, v.start_date::date, v.end_date::date
from (values
  ('les-plages-electroniques', '2027-08-06', '2027-08-08'),
  ('sziget', '2027-08-10', '2027-08-14')
) as v(slug, start_date, end_date)
join festivals f on f.slug = v.slug
on conflict (festival_id, year) do update
  set start_date = excluded.start_date,
      end_date = excluded.end_date;
