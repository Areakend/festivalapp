-- ============================================================
-- "Felix Kröcher" existed twice ('Felix Kröcher' and 'Felix Kroecher'),
-- missed by 20260816110000_merge_duplicate_artists.sql because that
-- pass only grouped by lower(name) -- an actual spelling difference
-- (ö vs oe), not a case difference, so it isn't caught by the unique
-- index that migration added either. Surfaced when both ended up
-- booked on the same Nibirii Festival 2026 lineup.
--
-- 'Felix Kroecher' carries the real spotify_artist_id/deezer_artist_id
-- (the canonical spelling's row never had them set), so those move
-- over before the duplicate is dropped -- same guard-then-repoint
-- shape as the two earlier artist/festival merges.
-- ============================================================

do $$
declare
  keep_id uuid;
  dup_id uuid;
  dup_spotify_id text;
  dup_deezer_id text;
  dup_genres text[];
begin
  select id into keep_id from public.artists where name = 'Felix Kröcher';
  select id into dup_id from public.artists where name = 'Felix Kroecher';

  if keep_id is null or dup_id is null then
    return;
  end if;

  select spotify_artist_id, deezer_artist_id, genres
    into dup_spotify_id, dup_deezer_id, dup_genres
    from public.artists where id = dup_id;

  -- Free the duplicate's unique columns first so the values can move
  -- onto the canonical row without a transient uniqueness clash.
  update public.artists set spotify_artist_id = null, deezer_artist_id = null where id = dup_id;

  update public.artists set
    spotify_artist_id = coalesce(spotify_artist_id, dup_spotify_id),
    deezer_artist_id = coalesce(deezer_artist_id, dup_deezer_id),
    genres = (select array(select distinct unnest(genres || dup_genres)))
  where id = keep_id;

  -- unique (edition_id, artist_id): drop the duplicate's row wherever
  -- the canonical artist is already booked for that same edition.
  delete from public.edition_artists dup
  where dup.artist_id = dup_id
    and exists (
      select 1 from public.edition_artists canon
      where canon.artist_id = keep_id and canon.edition_id = dup.edition_id
    );
  update public.edition_artists set artist_id = keep_id where artist_id = dup_id;

  -- unique (user_id, artist_id): same guard.
  delete from public.artist_follows dup
  where dup.artist_id = dup_id
    and exists (
      select 1 from public.artist_follows canon
      where canon.artist_id = keep_id and canon.user_id = dup.user_id
    );
  update public.artist_follows set artist_id = keep_id where artist_id = dup_id;

  delete from public.artists where id = dup_id;
end $$;
