-- Lets a user invite an accepted friend to a specific festival edition —
-- no push notifications yet (no infra for that in this app), invites just
-- show up next time the invitee opens the app.
create table public.festival_invites (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals(id) on delete cascade,
  edition_id uuid not null references public.festival_editions(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  constraint festival_invites_not_self check (inviter_id <> invitee_id),
  constraint festival_invites_unique unique (edition_id, inviter_id, invitee_id)
);

create index festival_invites_invitee_idx on public.festival_invites (invitee_id);
create index festival_invites_inviter_idx on public.festival_invites (inviter_id);

alter table public.festival_invites enable row level security;

-- Read: either side of the invite can see it.
create policy "festival invites read involved" on public.festival_invites
  for select using (auth.uid() = inviter_id or auth.uid() = invitee_id);

-- Insert: only to an accepted friend, and only if neither side has blocked
-- the other — same two checks friendships/review_votes already apply.
create policy "festival invites insert to friend" on public.festival_invites
  for insert with check (
    auth.uid() = inviter_id
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = invitee_id)
          or (f.addressee_id = auth.uid() and f.requester_id = invitee_id))
    )
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = invitee_id)
         or (b.blocker_id = invitee_id and b.blocked_id = auth.uid())
    )
  );

-- Update: only the invitee can respond, and only to accept/decline.
create policy "festival invites respond" on public.festival_invites
  for update using (auth.uid() = invitee_id)
  with check (auth.uid() = invitee_id and status in ('accepted', 'declined'));

-- Delete: the inviter can withdraw an invite they sent.
create policy "festival invites delete own" on public.festival_invites
  for delete using (auth.uid() = inviter_id);
