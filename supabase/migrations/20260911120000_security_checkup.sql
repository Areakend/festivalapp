-- ============================================================
-- Security checkup (2026-09-11) — four hardening fixes.
-- ============================================================

-- 1) festival_invites: the "respond" UPDATE policy only constrains
--    invitee_id + status, but the table-level UPDATE grant let the invitee
--    rewrite inviter_id / festival_id on their own row (forging "X invited
--    me"). Same column-level lock already applied to friendships: only
--    `status` is updatable from the client.
revoke update on table public.festival_invites from anon, authenticated;
grant update (status) on table public.festival_invites to authenticated;

-- 2) user_attendances.notes: the 20260715 column-level revoke isn't in
--    effect live (has_column_privilege('authenticated', ..., 'notes',
--    'SELECT') = true), so the "attendances public read" policy exposed the
--    column to every signed-in user. Nothing in the app reads or writes it
--    — drop it rather than re-fence it.
alter table public.user_attendances drop column if exists notes;

-- 3) profiles: readable without an account. No PII in the row, but the
--    only anonymous reader was the sign-up username pre-check — moved to a
--    security-definer RPC that returns a boolean instead of table access.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select to authenticated using (true);

create or replace function public.is_username_available(candidate text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(display_name) = lower(candidate)
  );
$$;
revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- 4) artist_follows: same — no reason for anonymous reads of who follows
--    which artist. Friend affinity (the reason it's readable at all) only
--    runs signed in.
drop policy if exists "artist follows public read" on public.artist_follows;
create policy "artist follows public read" on public.artist_follows
  for select to authenticated using (true);
