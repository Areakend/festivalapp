-- ============================================================
-- Deezer's developer portal has closed new app registrations
-- indefinitely, so the OAuth connect flow added in the previous
-- migration can never be used — dropping it in favor of the
-- unauthenticated-catalog-based universal export instead.
-- artists.deezer_artist_id is kept: the export still caches Deezer
-- artist matches, just via Deezer's public (no-auth) search endpoint.
-- ============================================================

-- The universal export doesn't save a playlist object anywhere, so it never
-- writes a playlists_generated row — 'spotify' remains the only provider.
alter table public.playlists_generated
  drop constraint playlists_generated_provider_check,
  drop column deezer_playlist_id;

alter table public.playlists_generated
  add constraint playlists_generated_provider_check check (provider in ('spotify'));

drop view public.deezer_connection_status;
drop table public.deezer_connections;
