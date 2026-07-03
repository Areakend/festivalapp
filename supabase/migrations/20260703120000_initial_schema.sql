-- ============================================================
-- Festiq — initial schema
-- Run via `supabase db push` or the Supabase SQL editor.
-- Security model: RLS on every table; public catalog data is
-- readable by everyone, user data is writable only by its owner.
-- Passwords are NEVER stored here — auth is fully delegated to
-- Supabase Auth (GoTrue), which stores only bcrypt hashes.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type festival_status as enum ('attended', 'planned', 'wishlist', 'favorite');
create type playlist_status as enum ('pending', 'preview', 'created', 'failed');

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================
-- PROFILES (1:1 with auth.users; created automatically on signup)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Raver',
  avatar_url text,
  country text, -- ISO 3166-1 alpha-2
  preferred_language text not null default 'en'
    check (preferred_language in ('en', 'fr', 'nl', 'de', 'es')),
  favorite_genres text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a user signs up (any provider).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'Raver'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- CATALOG: festivals, editions, artists, lineups, DJ Mag ranks
-- ============================================================
create table public.festivals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  country text not null, -- ISO 3166-1 alpha-2
  city text,
  venue text,
  latitude double precision,
  longitude double precision,
  genres text[] not null default '{}',
  number_of_stages int,
  capacity int,
  first_year int,
  is_active boolean not null default true,
  best_djmag_rank int, -- denormalized from djmag_rankings for fast lists
  official_website text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index festivals_country_idx on public.festivals (country);
create index festivals_genres_idx on public.festivals using gin (genres);
create index festivals_name_trgm_idx on public.festivals (lower(name));

create trigger festivals_updated_at before update on public.festivals
  for each row execute function public.set_updated_at();

create table public.festival_editions (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals (id) on delete cascade,
  year int not null,
  start_date date,
  end_date date,
  lineup_published boolean not null default false,
  poster_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (festival_id, year)
);

create index festival_editions_festival_idx on public.festival_editions (festival_id);

create trigger festival_editions_updated_at before update on public.festival_editions
  for each row execute function public.set_updated_at();

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  spotify_artist_id text unique,
  genres text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index artists_name_idx on public.artists (lower(name));

create trigger artists_updated_at before update on public.artists
  for each row execute function public.set_updated_at();

create table public.edition_artists (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.festival_editions (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,
  announced boolean not null default true,
  order_index int not null default 0, -- headliners first
  unique (edition_id, artist_id)
);

create index edition_artists_edition_idx on public.edition_artists (edition_id);

create table public.djmag_rankings (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals (id) on delete cascade,
  year int not null,
  rank_position int not null check (rank_position between 1 and 100),
  unique (festival_id, year)
);

create index djmag_rankings_year_idx on public.djmag_rankings (year, rank_position);

-- Keep festivals.best_djmag_rank in sync automatically.
create or replace function public.sync_best_djmag_rank()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.festivals f
  set best_djmag_rank = (
    select min(rank_position) from public.djmag_rankings r where r.festival_id = f.id
  )
  where f.id = coalesce(new.festival_id, old.festival_id);
  return null;
end $$;

create trigger djmag_rankings_sync after insert or update or delete on public.djmag_rankings
  for each row execute function public.sync_best_djmag_rank();

-- ============================================================
-- USER DATA: statuses, attendances, reviews
-- ============================================================
create table public.user_festival_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  festival_id uuid not null references public.festivals (id) on delete cascade,
  status festival_status not null,
  created_at timestamptz not null default now(),
  unique (user_id, festival_id, status)
);

create index ufs_user_idx on public.user_festival_statuses (user_id);
create index ufs_festival_idx on public.user_festival_statuses (festival_id);

create table public.user_attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  festival_id uuid not null references public.festivals (id) on delete cascade,
  edition_id uuid references public.festival_editions (id) on delete set null,
  attended_year int not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, festival_id, attended_year)
);

create index attendances_user_idx on public.user_attendances (user_id);

create trigger user_attendances_updated_at before update on public.user_attendances
  for each row execute function public.set_updated_at();

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  festival_id uuid not null references public.festivals (id) on delete cascade,
  edition_id uuid references public.festival_editions (id) on delete set null,
  overall_rating numeric(2, 1) not null check (overall_rating between 0.5 and 5),
  comment text check (char_length(comment) <= 4000),
  lineup_rating smallint check (lineup_rating between 1 and 5),
  production_rating smallint check (production_rating between 1 and 5),
  sound_rating smallint check (sound_rating between 1 and 5),
  organization_rating smallint check (organization_rating between 1 and 5),
  atmosphere_rating smallint check (atmosphere_rating between 1 and 5),
  value_rating smallint check (value_rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One review per user per festival edition (nullable edition treated as its own slot).
create unique index reviews_one_per_edition_idx on public.reviews (
  user_id, festival_id, coalesce(edition_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
create index reviews_festival_idx on public.reviews (festival_id);

create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- ============================================================
-- SPOTIFY
-- ============================================================
-- Tokens are written ONLY by Edge Functions using the service role.
-- TODO(production): move tokens to Supabase Vault or encrypt with pgsodium.
create table public.spotify_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  spotify_user_id text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger spotify_connections_updated_at before update on public.spotify_connections
  for each row execute function public.set_updated_at();

-- Safe, token-free view for the client to display connection status.
create view public.spotify_connection_status
with (security_invoker = true) as
  select user_id, spotify_user_id, created_at from public.spotify_connections;

create table public.playlists_generated (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  festival_id uuid not null references public.festivals (id) on delete cascade,
  edition_id uuid references public.festival_editions (id) on delete set null,
  spotify_playlist_id text,
  playlist_name text not null,
  total_artists int not null default 0,
  matched_artists int not null default 0,
  total_tracks int not null default 0,
  status playlist_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index playlists_user_idx on public.playlists_generated (user_id);

-- ============================================================
-- COMMUNITY RANKING — Bayesian average to avoid low-vote bias:
-- score = (v / (v + m)) * R + (m / (v + m)) * C
--   R = festival mean rating, v = its vote count,
--   m = confidence threshold (10 votes), C = global mean rating.
-- ============================================================
create view public.festival_community_stats
with (security_invoker = true) as
with global_stats as (
  select coalesce(avg(overall_rating), 3.5) as global_mean from public.reviews
),
per_festival as (
  select festival_id, avg(overall_rating) as avg_rating, count(*) as rating_count
  from public.reviews
  group by festival_id
)
select
  f.id as festival_id,
  coalesce(pf.avg_rating, 0)::numeric(3, 2) as avg_rating,
  coalesce(pf.rating_count, 0) as rating_count,
  case
    when pf.rating_count is null then 0
    else (
      (pf.rating_count::numeric / (pf.rating_count + 10)) * pf.avg_rating
      + (10::numeric / (pf.rating_count + 10)) * g.global_mean
    )
  end::numeric(4, 3) as bayesian_score
from public.festivals f
cross join global_stats g
left join per_festival pf on pf.festival_id = f.id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.festivals enable row level security;
alter table public.festival_editions enable row level security;
alter table public.artists enable row level security;
alter table public.edition_artists enable row level security;
alter table public.djmag_rankings enable row level security;
alter table public.user_festival_statuses enable row level security;
alter table public.user_attendances enable row level security;
alter table public.reviews enable row level security;
alter table public.spotify_connections enable row level security;
alter table public.playlists_generated enable row level security;

-- Public catalog: readable by everyone, writable only via service role (no policy).
create policy "catalog read" on public.festivals for select using (true);
create policy "catalog read" on public.festival_editions for select using (true);
create policy "catalog read" on public.artists for select using (true);
create policy "catalog read" on public.edition_artists for select using (true);
create policy "catalog read" on public.djmag_rankings for select using (true);

-- Profiles: public read (community app), owner-only writes.
create policy "profiles read" on public.profiles for select using (true);
create policy "profiles update own" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Statuses & attendances: private to the owner.
create policy "statuses own all" on public.user_festival_statuses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "attendances own all" on public.user_attendances for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reviews: public read, owner-only writes.
create policy "reviews read" on public.reviews for select using (true);
create policy "reviews insert own" on public.reviews for insert
  with check (auth.uid() = user_id);
create policy "reviews update own" on public.reviews for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reviews delete own" on public.reviews for delete
  using (auth.uid() = user_id);

-- Spotify connections: owner can see/delete their row (tokens excluded via
-- the status view in app code); inserts/updates happen via Edge Functions.
create policy "spotify select own" on public.spotify_connections for select
  using (auth.uid() = user_id);
create policy "spotify delete own" on public.spotify_connections for delete
  using (auth.uid() = user_id);

-- Generated playlists: private to the owner.
create policy "playlists own all" on public.playlists_generated for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
