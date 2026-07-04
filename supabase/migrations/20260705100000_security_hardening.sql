-- ============================================================
-- Security hardening (issues found in a full RLS/permissions audit).
--
-- 1) friendships: the accept policy's WITH CHECK only constrained
--    `status`, so an addressee could UPDATE requester_id and forge an
--    accepted friendship with an arbitrary user — which in turn
--    unlocked that user's tracked festivals through the
--    "statuses friends read" policy. RLS can't compare OLD vs NEW,
--    so on top of re-checking the addressee on the new row, updates
--    are restricted to the `status` column via column-level grants.
--
-- 2) spotify_connections: the owner-select policy let the client read
--    access_token / refresh_token through PostgREST. The app only
--    ever needs the token-free spotify_connection_status view, so the
--    token columns are hidden from client roles entirely (Edge
--    Functions use the service role and are unaffected).
-- ============================================================

-- ---------- 1) friendships ----------
drop policy "friendships accept" on public.friendships;
create policy "friendships accept" on public.friendships for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id and status = 'accepted');

revoke update on table public.friendships from anon, authenticated;
grant update (status) on table public.friendships to authenticated;

-- ---------- 2) spotify_connections ----------
revoke select on table public.spotify_connections from anon, authenticated;
grant select (user_id, spotify_user_id, created_at)
  on table public.spotify_connections to authenticated;
