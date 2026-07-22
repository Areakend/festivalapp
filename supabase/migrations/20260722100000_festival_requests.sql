-- Lets signed-in users suggest a festival that's missing from the catalog.
-- Free-text fields (name/website) are never rendered anywhere outside this
-- table and the submitter's own "my requests" list — no other user ever
-- sees another user's submission, so there's no stored-XSS surface even
-- though this is unmoderated input. Reviewed manually (direct DB access),
-- not auto-created into `festivals`.
create table public.festival_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  country text check (char_length(country) <= 100),
  website text check (char_length(website) <= 500),
  status text not null default 'pending' check (status in ('pending', 'added', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.festival_requests enable row level security;

create policy "festival requests insert own" on public.festival_requests
  for insert with check (auth.uid() = user_id);

create policy "festival requests read own" on public.festival_requests
  for select using (auth.uid() = user_id);
