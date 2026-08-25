-- ============================================================
-- festival_community_stats was a plain view, recomputing avg/count
-- over the ENTIRE reviews table (including a table-wide global mean
-- with no WHERE clause at all) on every single read — and it's read
-- on nearly every screen (home, discover, profile, share). Fine at a
-- few dozen reviews; a real bottleneck once that table has tens of
-- thousands of rows and many concurrent readers. Materialized so the
-- expensive aggregation runs on a schedule instead of per-request.
-- ============================================================

drop view public.festival_community_stats;

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
  -- Ratings are on a /20 scale, not /10 — numeric(3,2) (max 9.99) was
  -- always wrong for this and silently relied on the old view never
  -- being force-evaluated across every row at once. numeric(4,2) covers
  -- the full 0.00-20.00 range with headroom.
  coalesce(pf.avg_rating, 0)::numeric(4, 2) as avg_rating,
  coalesce(pf.rating_count, 0) as rating_count,
  case
    when pf.rating_count is null then 0
    else (
      (pf.rating_count::numeric / (pf.rating_count + 10)) * pf.avg_rating
      + (10::numeric / (pf.rating_count + 10)) * g.global_mean
    )
  end::numeric(5, 3) as bayesian_score
from public.festivals f
cross join global_stats g
left join per_festival pf on pf.festival_id = f.id
with data;

-- Required for REFRESH ... CONCURRENTLY (lets reads continue against
-- the old snapshot while a refresh is in progress, instead of
-- blocking on a lock).
create unique index festival_community_stats_festival_id_idx
  on public.festival_community_stats (festival_id);

-- Matviews have no RLS (Postgres doesn't support it on them) — this
-- is public aggregate data with no per-user variation anyway, same as
-- what the view exposed to everyone before.
grant select on public.festival_community_stats to anon, authenticated;

create or replace function public.refresh_festival_community_stats()
returns void
language sql
security definer
set search_path = public
as $$
  refresh materialized view concurrently public.festival_community_stats;
$$;

select cron.schedule(
  'refresh-festival-community-stats',
  '*/15 * * * *',
  $$select public.refresh_festival_community_stats()$$
);
