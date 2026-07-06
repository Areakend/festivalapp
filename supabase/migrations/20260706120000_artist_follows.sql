-- ============================================================
-- In-app artist following: replaces the Spotify-account-based follow
-- feature (highlighting/ranking festivals no longer needs a live Spotify
-- connection). A one-time "import from Spotify" action can still seed
-- this list from the user's real Spotify follows.
-- ============================================================

create table public.artist_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, artist_id)
);

create index artist_follows_user_idx on public.artist_follows (user_id);

alter table public.artist_follows enable row level security;

create policy "artist follows own all" on public.artist_follows for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
