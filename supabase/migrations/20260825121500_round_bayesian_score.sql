-- bayesian_score was numeric(5,3) — three decimals is more precision
-- than a /20 rating ever needs to display or compare by; round to the
-- same 0.01 max as avg_rating.

drop materialized view public.festival_community_stats;

create materialized view public.festival_community_stats as
with global_stats as (
  select coalesce(avg(overall_rating), 3.5) as global_mean from public.reviews
),
per_festival as (
  select festival_id, avg(overall_rating) as avg_rating, count(*) as rating_count
  from public.reviews
  group by festival_id
)
select
  f.id as festival_id,
  coalesce(pf.avg_rating, 0)::numeric(4, 2) as avg_rating,
  coalesce(pf.rating_count, 0) as rating_count,
  case
    when pf.rating_count is null then 0
    else (
      (pf.rating_count::numeric / (pf.rating_count + 10)) * pf.avg_rating
      + (10::numeric / (pf.rating_count + 10)) * g.global_mean
    )
  end::numeric(4, 2) as bayesian_score
from public.festivals f
cross join global_stats g
left join per_festival pf on pf.festival_id = f.id
with data;

create unique index festival_community_stats_festival_id_idx
  on public.festival_community_stats (festival_id);

grant select on public.festival_community_stats to anon, authenticated;
