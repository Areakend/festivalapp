-- Custom personal calendar entries (real-life commitments — a wedding, a
-- work trip) so the planning calendar can show them alongside tracked
-- festivals, letting a user notice a clash before buying tickets instead
-- of after. Private to their owner: nobody else has a reason to see them.
create table public.personal_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);

create index personal_events_user_idx on public.personal_events (user_id);

alter table public.personal_events enable row level security;

create policy "personal events own all" on public.personal_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
