-- ============================================================
-- "Les Plages Électroniques" was seeded twice under two different
-- slugs: 'les-plages-electroniques' (via the DJ Mag Top 100 batch —
-- has real dates, lineup and rankings for 2024-2026) and
-- 'plage-electro' (via a separate personal-archive batch — metadata
-- only, no editions/lineup ever seeded for it).
--
-- Repoints any user-generated rows that might reference the
-- 'plage-electro' duplicate onto the canonical festival before
-- deleting it, guarding the two tables with a unique constraint that
-- includes festival_id so a user who happened to have rows against
-- both duplicates doesn't hit a conflict.
-- ============================================================

do $$
declare
  canonical_id uuid;
  duplicate_id uuid;
begin
  select id into canonical_id from public.festivals where slug = 'les-plages-electroniques';
  select id into duplicate_id from public.festivals where slug = 'plage-electro';

  if duplicate_id is null or canonical_id is null then
    return;
  end if;

  -- unique (user_id, festival_id, status): drop the duplicate's row
  -- wherever the user already has the same status on the canonical one.
  delete from public.user_festival_statuses dup
  where dup.festival_id = duplicate_id
    and exists (
      select 1 from public.user_festival_statuses canon
      where canon.festival_id = canonical_id
        and canon.user_id = dup.user_id
        and canon.status = dup.status
    );
  update public.user_festival_statuses set festival_id = canonical_id where festival_id = duplicate_id;

  -- unique (user_id, festival_id, attended_year): same guard.
  delete from public.user_attendances dup
  where dup.festival_id = duplicate_id
    and exists (
      select 1 from public.user_attendances canon
      where canon.festival_id = canonical_id
        and canon.user_id = dup.user_id
        and canon.attended_year = dup.attended_year
    );
  update public.user_attendances set festival_id = canonical_id where festival_id = duplicate_id;

  -- No unique constraint on (user_id, festival_id) for reviews or
  -- playlists_generated, so a plain repoint can't conflict.
  update public.reviews set festival_id = canonical_id where festival_id = duplicate_id;
  update public.playlists_generated set festival_id = canonical_id where festival_id = duplicate_id;

  delete from public.festivals where id = duplicate_id;
end $$;
