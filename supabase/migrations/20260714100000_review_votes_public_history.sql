-- ============================================================
-- 1) Review upvotes — a denormalized upvote_count on reviews, kept in
--    sync by trigger (same pattern as festivals.best_djmag_rank), so
--    listing reviews never needs a join/count. summarize-reviews reads
--    it to weigh consensus-backed reviews more heavily.
-- 2) Public history: past attendance becomes visible to any signed-in
--    user (not just friends) so tapping a reviewer's name shows their
--    festival history — planned/wishlist/favorite stay friends-only.
-- ============================================================

alter table public.reviews add column upvote_count int not null default 0;

create table public.review_votes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

create index review_votes_review_idx on public.review_votes (review_id);

create or replace function public.sync_review_upvote_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.reviews r
  set upvote_count = (select count(*) from public.review_votes v where v.review_id = coalesce(new.review_id, old.review_id))
  where r.id = coalesce(new.review_id, old.review_id);
  return null;
end $$;

create trigger review_votes_sync after insert or delete on public.review_votes
  for each row execute function public.sync_review_upvote_count();

alter table public.review_votes enable row level security;

-- Scoped "to authenticated" (not anon) throughout this section: this is
-- meant to be visible to other signed-in app users — the ones who could
-- plausibly tap a reviewer's name — not to unauthenticated REST calls
-- made with just the public anon key.
create policy "review votes read" on public.review_votes for select to authenticated using (true);
create policy "review votes insert own" on public.review_votes for insert
  with check (auth.uid() = user_id);
create policy "review votes delete own" on public.review_votes for delete
  using (auth.uid() = user_id);

-- ---------- public history (attended only) ----------
create policy "statuses attended public read" on public.user_festival_statuses for select
  to authenticated using (status = 'attended');

create policy "attendances public read" on public.user_attendances for select
  to authenticated using (true);
