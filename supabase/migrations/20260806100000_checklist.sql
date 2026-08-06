-- Festival packing checklist. Item *catalogs* (base list, conditional
-- groups keyed by context toggle) live in app code, not the database --
-- this table only stores per-user state: which items are checked, plus
-- any free-text items the user adds themselves.
--
-- Context toggles (camping / beach / sunny) are stored as regular rows
-- using a reserved `pref:<name>` item_key, with is_checked doubling as
-- the toggle's boolean value. This lets a user's toggle choice persist
-- across visits without a second table, and lets the client tell "never
-- set, use the heuristic default" (no row) apart from "explicitly set"
-- (a row exists, whatever its value).
create table public.user_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  festival_id uuid not null references public.festivals (id) on delete cascade,
  item_key text not null check (char_length(item_key) between 1 and 100),
  label text not null check (char_length(label) <= 200),
  is_checked boolean not null default false,
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, festival_id, item_key)
);

create index user_checklist_items_user_festival_idx
  on public.user_checklist_items (user_id, festival_id);

alter table public.user_checklist_items enable row level security;

create policy "checklist items own all" on public.user_checklist_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
