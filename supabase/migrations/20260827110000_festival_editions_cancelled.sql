-- Some editions get announced with real dates and then cancelled after
-- the fact (Wireless Festival 2026, pulled after a headliner's UK entry
-- ban) — rather than deleting the row and losing that history, or leaving
-- it indistinguishable from a normal upcoming edition, this flags it so
-- the app can exclude it from "next edition" selection while still
-- surfacing it on the festival's own page.
alter table public.festival_editions add column cancelled boolean not null default false;
