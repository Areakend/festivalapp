-- ============================================================
-- Deezer integration: an alternative to Spotify for playlist
-- generation, since Deezer's playlist API doesn't require the app
-- owner to hold a paid subscription (unlike Spotify's Feb 2026 policy).
--
-- Mirrors spotify_connections, hardened from the start (see the
-- 20260705100000 migration for why token columns are hidden from
-- client roles). Deezer's offline_access tokens don't expire, so
-- there's no refresh_token/expires_at bookkeeping to do.
-- ============================================================

alter table public.artists add column deezer_artist_id text unique;

create table public.deezer_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  deezer_user_id text not null,
  access_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger deezer_connections_updated_at before update on public.deezer_connections
  for each row execute function public.set_updated_at();

-- Token-free view for the client to display connection status.
create view public.deezer_connection_status
with (security_invoker = true) as
  select user_id, deezer_user_id, created_at from public.deezer_connections;

alter table public.deezer_connections enable row level security;

create policy "deezer select own" on public.deezer_connections for select
  using (auth.uid() = user_id);
create policy "deezer delete own" on public.deezer_connections for delete
  using (auth.uid() = user_id);

revoke select on table public.deezer_connections from anon, authenticated;
grant select (user_id, deezer_user_id, created_at)
  on table public.deezer_connections to authenticated;

-- Track which service a generated playlist was created on.
alter table public.playlists_generated
  add column provider text not null default 'spotify',
  add column deezer_playlist_id text,
  add constraint playlists_generated_provider_check check (provider in ('spotify', 'deezer'));
