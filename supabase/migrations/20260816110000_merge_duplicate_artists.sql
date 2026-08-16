-- ============================================================
-- Merges every duplicate artist row (same name, case-insensitive) into
-- one canonical row, same treatment the 'plage-electro' festival
-- duplicate already got in 20260706100000_merge_duplicate_plage_electro.sql.
-- Found while adding Les Plages Électroniques' 2026 lineup: Martin
-- Garrix already existed twice, and turned out to be one of 16 such
-- pairs (Amelie Lens, Amyl and The Sniffers, Angerfist, Armin van
-- Buuren, BillX, BYØRN, Charlotte de Witte, David Guetta, Feder,
-- FISHER, Martin Garrix, Perceval, Swedish House Mafia, Tale Of Us,
-- Tomora, TVOD) -- each one silently splitting that artist's lineup
-- appearances and follow-matching across two different artist_ids.
--
-- Root cause: `artists` had no uniqueness constraint at all, so a seed
-- file that skipped the usual "where not exists (... lower(name) ...)"
-- guard (several early lineup batches, going by an ALL-CAPS name in
-- half of these pairs -- looks like straight off an all-caps poster)
-- could freely insert a second row for the same person. The final
-- step below adds that constraint at the database level so this can't
-- recur regardless of what any future seed file does or doesn't check.
-- ============================================================

do $$
declare
  grp record;
  keep_id uuid;
  dup_id uuid;
begin
  for grp in
    select lower(name) as norm
    from public.artists
    group by lower(name)
    having count(*) > 1
  loop
    -- Prefer a non-ALL-CAPS spelling as the surviving name; tie-break by id.
    select id into keep_id
    from public.artists
    where lower(name) = grp.norm
    order by (name = upper(name)) asc, id asc
    limit 1;

    for dup_id in
      select id from public.artists where lower(name) = grp.norm and id <> keep_id
    loop
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
    end loop;
  end loop;
end $$;

create unique index artists_name_unique_idx on public.artists (lower(name));
