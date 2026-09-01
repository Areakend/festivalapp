-- ============================================================
-- useAutoAdvancePlannedFestivals (client-side) only converts a
-- "planned" status to "attended" once the edition has finished when
-- the CONCERNED user happens to open the app. A friend viewing that
-- user's calendar/statuses in the meantime keeps seeing a stale
-- "planned" for an edition that already happened. Server-side cron
-- mirrors the exact same rule so it converges for everyone, not just
-- whoever opens the app next.
-- ============================================================

create or replace function public.auto_advance_planned_festivals()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A `with` CTE only lives for the single statement it's attached to,
  -- not for every statement in this function body — materialize the
  -- due set once into a temp table instead so all three DML statements
  -- below see the same snapshot.
  create temporary table due_planned on commit drop as
  -- Same rule as usePastEditionsForFestivals: only the single latest
  -- edition on record per festival (by start_date desc) counts, so a
  -- festival with an upcoming edition already scheduled is never
  -- treated as "finished" just because an older edition happened.
  with latest_editions as (
    select distinct on (festival_id)
      festival_id,
      year,
      coalesce(end_date, start_date) as finished_by
    from festival_editions
    where start_date is not null
    order by festival_id, start_date desc
  )
  select ufs.id as status_id, ufs.user_id, ufs.festival_id, le.year, le.finished_by
  from user_festival_statuses ufs
  join latest_editions le on le.festival_id = ufs.festival_id
  where ufs.status = 'planned'
    and le.finished_by < current_date
    -- Only advance a status set BEFORE the edition finished — a
    -- "planned" marked after it already finished is presumably about
    -- a future edition not yet in the catalog and must not be
    -- silently reinterpreted as "yes I went".
    and ufs.created_at < le.finished_by::timestamptz;

  insert into user_festival_statuses (user_id, festival_id, status)
  select d.user_id, d.festival_id, 'attended'
  from due_planned d
  where not exists (
    select 1 from user_festival_statuses s2
    where s2.user_id = d.user_id and s2.festival_id = d.festival_id and s2.status = 'attended'
  );

  insert into user_attendances (user_id, festival_id, attended_year)
  select d.user_id, d.festival_id, d.year
  from due_planned d
  where not exists (
    select 1 from user_attendances a2
    where a2.user_id = d.user_id and a2.festival_id = d.festival_id and a2.attended_year = d.year
  );

  delete from user_festival_statuses ufs
  using due_planned d
  where ufs.id = d.status_id;
end;
$$;

select cron.schedule(
  'auto-advance-planned-festivals',
  '0 3 * * *',
  $$select public.auto_advance_planned_festivals()$$
);
