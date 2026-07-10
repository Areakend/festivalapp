-- ============================================================
-- Shared festival playlists (Option 1: one public Spotify playlist
-- per edition, generated once under the app's own curator account
-- instead of requiring every user to connect their own Spotify —
-- that per-user OAuth was hitting Spotify's 25-user Development Mode
-- cap. The generate-playlist Edge Function now checks this cache
-- first and only calls the Spotify API on a true first request for
-- a given edition; everyone after that is redirected to the same
-- playlist. Catalog-style data: readable by everyone, written only
-- by the Edge Function via the service role.
-- ============================================================

create table public.festival_playlists (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals (id) on delete cascade,
  edition_id uuid not null unique references public.festival_editions (id) on delete cascade,
  spotify_playlist_id text not null,
  spotify_playlist_url text not null,
  total_artists int not null default 0,
  matched_artists int not null default 0,
  total_tracks int not null default 0,
  skipped_artists text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index festival_playlists_festival_idx on public.festival_playlists (festival_id);

alter table public.festival_playlists enable row level security;

create policy "festival playlists read" on public.festival_playlists for select using (true);
