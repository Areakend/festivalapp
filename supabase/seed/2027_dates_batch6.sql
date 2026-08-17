-- Final batch of this sweep: 2027 dates confirmed via official sites.

insert into festival_editions (festival_id, year, start_date, end_date)
select f.id, 2027, v.start_date::date, v.end_date::date
from (values
  ('opener-festival', '2027-06-30', '2027-07-03'),
  ('roskilde-festival', '2027-06-26', '2027-07-03'),
  ('download-festival', '2027-06-09', '2027-06-13')
) as v(slug, start_date, end_date)
join festivals f on f.slug = v.slug
on conflict (festival_id, year) do update
  set start_date = excluded.start_date,
      end_date = excluded.end_date;
