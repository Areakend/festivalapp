-- Who a user follows is the same category of "not sensitive, already
-- shown elsewhere" info as attendance history or favorite_genres (both
-- public already) — needed to compute a friend profile's "in common"
-- comparison. Adds a permissive read-everyone policy alongside the
-- existing owner-only ALL policy; RLS combines permissive policies with
-- OR, so this only widens read access, ownership still gates writes.
create policy "artist follows public read" on public.artist_follows
  for select using (true);
