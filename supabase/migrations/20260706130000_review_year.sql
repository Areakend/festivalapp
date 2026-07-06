-- Which edition year a review is about (independent of edition_id, which
-- requires a matching festival_editions row we often don't have for older
-- years) — free-form int so it lines up with user_attendances.attended_year.

alter table public.reviews add column year int;
alter table public.reviews add constraint reviews_year_check
  check (year is null or year between 1970 and 2100);
