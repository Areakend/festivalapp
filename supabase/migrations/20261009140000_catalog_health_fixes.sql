-- ============================================================
-- Catalog health check (2026-10-09): the two fixes that carry no risk.
-- Everything else the check found is a recommendation, not a migration.
-- ============================================================

-- 1) "Gigola" and "DJ Gigola" are the same act (Sonora's lineup vs Sónar / AVA /
--    Dour / Nibirii, techno on both sides — "DJ" is just a stylization). Same
--    guard-then-repoint merge as 20260816110000 / 20260827100000, keeping the
--    spelling that already carries 4 lineup links.
create or replace function pg_temp.merge_artist(keep_name text, dup_name text) returns void
language plpgsql as $$
declare
  keep_id uuid; dup_id uuid;
  dup_spotify_id text; dup_deezer_id text; dup_genres text[];
begin
  select id into keep_id from public.artists where name = keep_name;
  select id into dup_id from public.artists where name = dup_name;
  if keep_id is null or dup_id is null or keep_id = dup_id then return; end if;

  select spotify_artist_id, deezer_artist_id, genres into dup_spotify_id, dup_deezer_id, dup_genres
    from public.artists where id = dup_id;
  update public.artists set spotify_artist_id = null, deezer_artist_id = null where id = dup_id;
  update public.artists set
    spotify_artist_id = coalesce(spotify_artist_id, dup_spotify_id),
    deezer_artist_id = coalesce(deezer_artist_id, dup_deezer_id),
    genres = (select array(select distinct unnest(genres || dup_genres)))
  where id = keep_id;

  delete from public.edition_artists dup where dup.artist_id = dup_id
    and exists (select 1 from public.edition_artists c where c.artist_id = keep_id and c.edition_id = dup.edition_id);
  update public.edition_artists set artist_id = keep_id where artist_id = dup_id;

  delete from public.artist_follows dup where dup.artist_id = dup_id
    and exists (select 1 from public.artist_follows c where c.artist_id = keep_id and c.user_id = dup.user_id);
  update public.artist_follows set artist_id = keep_id where artist_id = dup_id;

  delete from public.artists where id = dup_id;
end $$;

do $$
begin
  perform pg_temp.merge_artist('DJ Gigola', 'Gigola');
end $$;

-- 2) Genre vocabulary: four spellings of tags that already exist in their
--    canonical form split the Festivals filter in two (hip-hop 26 vs hiphop 11,
--    drum and bass 4 vs dnb 5, hard techno 9 vs hardtechno 1, rawstyle 6 vs raw 1).
--    Normalised everywhere a genre string is compared: festivals, artists, AND
--    users' favorite_genres, so nobody's followed genres silently stop matching.
--    First-occurrence order is kept (the first tag is the festival's main one).
create or replace function pg_temp.fix_genres(g text[]) returns text[]
language sql immutable as $$
  select coalesce(array_agg(v order by first_pos), '{}')
  from (
    select case x
             when 'hiphop' then 'hip-hop'
             when 'hardtechno' then 'hard techno'
             when 'dnb' then 'drum and bass'
             when 'raw' then 'rawstyle'
             else x
           end as v,
           min(ord) as first_pos
    from unnest(g) with ordinality as t(x, ord)
    group by 1
  ) s
$$;

update public.festivals set genres = pg_temp.fix_genres(genres)
where genres && array['hiphop', 'hardtechno', 'dnb', 'raw'];

update public.artists set genres = pg_temp.fix_genres(genres)
where genres && array['hiphop', 'hardtechno', 'dnb', 'raw'];

update public.profiles set favorite_genres = pg_temp.fix_genres(favorite_genres)
where favorite_genres && array['hiphop', 'hardtechno', 'dnb', 'raw'];
