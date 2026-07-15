-- ============================================================
-- Fixes from the 2026-07-15 security review.
--
-- 1) HIGH: "attendances public read" (see review_votes_public_history
--    migration) exposes the entire user_attendances row to any
--    authenticated user via `using (true)`, including `notes` — a
--    private free-text field, distinct from the public review
--    comment. Column-level grants restrict every authenticated
--    reader (including the row owner, symmetric with the
--    spotify_connections token-hiding pattern) to the fields the
--    public-history feature actually needs; notes stays server-side
--    only. useMyAttendances() in src/features/festivals/api.ts is
--    updated in the same PR to select these columns explicitly
--    instead of '*'.
--
-- 2) MEDIUM: blocking (user_blocks) was only enforced client-side on
--    review lists — a blocked user could still send a friend request
--    or upvote the blocker's reviews. Both insert policies now check
--    user_blocks in either direction.
--
-- 3) LOW: review_votes had no check preventing a user from upvoting
--    their own review, inflating upvote_count (which summarize-reviews
--    weights). Added to the same insert policy.
-- ============================================================

-- ---------- 1) user_attendances: hide notes from public reads ----------
revoke select on table public.user_attendances from anon, authenticated;
grant select (id, user_id, festival_id, edition_id, attended_year, created_at, updated_at)
  on table public.user_attendances to authenticated;

-- ---------- 2) friendships: block-aware request ----------
drop policy "friendships request" on public.friendships;
create policy "friendships request" on public.friendships for insert
  with check (
    auth.uid() = requester_id and status = 'pending'
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = requester_id and b.blocked_id = addressee_id)
         or (b.blocker_id = addressee_id and b.blocked_id = requester_id)
    )
  );

-- ---------- 2+3) review_votes: block-aware, no self-upvote ----------
drop policy "review votes insert own" on public.review_votes;
create policy "review votes insert own" on public.review_votes for insert
  with check (
    auth.uid() = review_votes.user_id
    and review_votes.user_id <> (select r.user_id from public.reviews r where r.id = review_votes.review_id)
    and not exists (
      select 1 from public.user_blocks b
      join public.reviews r on r.id = review_votes.review_id
      where (b.blocker_id = review_votes.user_id and b.blocked_id = r.user_id)
         or (b.blocker_id = r.user_id and b.blocked_id = review_votes.user_id)
    )
  );
