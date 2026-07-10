-- ============================================================
-- UGC moderation, required by Google Play's User-Generated Content
-- policy: users must be able to report objectionable content and
-- block other users from within the app.
--
-- content_reports: write-only for users (reports are reviewed by the
-- operator via the dashboard/service role — no client read policy).
-- user_blocks: fully private to the blocker; the app filters blocked
-- users' reviews out client-side.
-- ============================================================

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  review_id uuid references public.reviews (id) on delete set null,
  reported_user_id uuid references public.profiles (id) on delete cascade,
  reason text not null default 'inappropriate' check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  check (review_id is not null or reported_user_id is not null)
);

create index content_reports_review_idx on public.content_reports (review_id);

alter table public.content_reports enable row level security;

create policy "reports insert own" on public.content_reports for insert
  with check (auth.uid() = reporter_id);

create table public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index user_blocks_blocker_idx on public.user_blocks (blocker_id);

alter table public.user_blocks enable row level security;

create policy "blocks own all" on public.user_blocks for all
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);
