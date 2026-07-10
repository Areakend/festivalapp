-- ============================================================
-- Allow one review per user per festival per YEAR instead of one
-- review total. edition_id was never actually populated by the app
-- (reviews are inserted without it), so the old unique index on
-- coalesce(edition_id, ...) silently collapsed to "one review per
-- festival, period" — this replaces it with the column the app
-- actually uses (year), matching how user_attendances already works.
-- ============================================================

drop index public.reviews_one_per_edition_idx;

create unique index reviews_one_per_year_idx on public.reviews (
  user_id, festival_id, coalesce(year, -1)
);
