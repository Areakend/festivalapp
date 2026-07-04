-- ============================================================
-- 1) Ratings move from a 5-star scale to /20 (existing values ×4)
-- 2) Friendships table + RLS so friends can see each other's
--    tracked festivals (wishlist, attended…)
-- ============================================================

-- ---------- ratings: /5 → /20 ----------
-- The stats view depends on overall_rating, drop it first (recreated below).
drop view public.festival_community_stats;

alter table public.reviews drop constraint reviews_overall_rating_check;
alter table public.reviews
  alter column overall_rating type numeric(3, 1) using overall_rating * 4;
alter table public.reviews
  add constraint reviews_overall_rating_check check (overall_rating between 1 and 20);

do $$
declare col text;
begin
  foreach col in array array[
    'lineup_rating', 'production_rating', 'sound_rating',
    'organization_rating', 'atmosphere_rating', 'value_rating'
  ] loop
    execute format('alter table public.reviews drop constraint reviews_%s_check', col);
    execute format('update public.reviews set %I = %I * 4 where %I is not null', col, col, col);
    execute format(
      'alter table public.reviews add constraint reviews_%s_check check (%I between 1 and 20)',
      col, col
    );
  end loop;
end $$;

-- Recreate the Bayesian view for the /20 scale (wider numerics,
-- neutral prior 14/20 ≈ the old 3.5/5).
create view public.festival_community_stats
with (security_invoker = true) as
with global_stats as (
  select coalesce(avg(overall_rating), 14) as global_mean from public.reviews
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
  end::numeric(5, 3) as bayesian_score
from public.festivals f
cross join global_stats g
left join per_festival pf on pf.festival_id = f.id;

-- ---------- friendships ----------
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

-- One relationship per pair, whichever direction it was requested in.
create unique index friendships_pair_idx on public.friendships (
  least(requester_id, addressee_id), greatest(requester_id, addressee_id)
);

create trigger friendships_updated_at before update on public.friendships
  for each row execute function public.set_updated_at();

alter table public.friendships enable row level security;

create policy "friendships involved read" on public.friendships for select
  using (auth.uid() in (requester_id, addressee_id));
create policy "friendships request" on public.friendships for insert
  with check (auth.uid() = requester_id and status = 'pending');
create policy "friendships accept" on public.friendships for update
  using (auth.uid() = addressee_id) with check (status = 'accepted');
create policy "friendships remove" on public.friendships for delete
  using (auth.uid() in (requester_id, addressee_id));

-- Friends can see each other's tracked festivals (statuses only —
-- attendances/notes stay private; reviews were already public).
create policy "statuses friends read" on public.user_festival_statuses for select
  using (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = user_id)
        )
    )
  );
