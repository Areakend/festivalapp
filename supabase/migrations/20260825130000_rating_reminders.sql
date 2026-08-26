-- Tracks which "go rate this festival" push reminders have already been
-- sent, so the daily job never nags the same person about the same
-- (festival, year) twice — whether because they still haven't rated it a
-- week later, or the job happens to run more than once on the same day.
create table public.rating_reminders_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  festival_id uuid not null references public.festivals (id) on delete cascade,
  attended_year int not null,
  sent_at timestamptz not null default now(),
  unique (user_id, festival_id, attended_year)
);

-- Service-role only (the edge function) — no client ever needs to read or
-- write this, it's purely internal bookkeeping.
alter table public.rating_reminders_sent enable row level security;

-- Attendances whose edition finished exactly 3 days ago, not yet reviewed,
-- and not already reminded. Kept as one SQL function (rather than several
-- round trips from the Edge Function) so the anti-joins against reviews
-- and rating_reminders_sent run in the database where they belong.
create or replace function public.rating_reminder_candidates()
returns table (
  user_id uuid,
  festival_id uuid,
  attended_year int,
  festival_name text,
  preferred_language text
)
language sql
security definer
set search_path = public
as $$
  select ua.user_id, ua.festival_id, ua.attended_year, f.name, p.preferred_language
  from user_attendances ua
  join festival_editions fe
    on fe.festival_id = ua.festival_id and fe.year = ua.attended_year
  join festivals f on f.id = ua.festival_id
  join profiles p on p.id = ua.user_id
  where coalesce(fe.end_date, fe.start_date) = (current_date - interval '3 days')::date
    and not exists (
      select 1 from reviews r
      where r.user_id = ua.user_id and r.festival_id = ua.festival_id
        and coalesce(r.year, -1) = ua.attended_year
    )
    and not exists (
      select 1 from rating_reminders_sent rrs
      where rrs.user_id = ua.user_id and rrs.festival_id = ua.festival_id
        and rrs.attended_year = ua.attended_year
    );
$$;

revoke execute on function public.rating_reminder_candidates() from anon, authenticated;
