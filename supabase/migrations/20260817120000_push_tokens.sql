-- Expo push tokens, one row per (user, device). RLS restricts every row to
-- its own owner — nobody, including other users, can read anyone's token
-- through the client. The send-push-notification edge function reads
-- across users via the service role key, same pattern as every other
-- privileged edge function in this app.
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "push tokens own all" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
