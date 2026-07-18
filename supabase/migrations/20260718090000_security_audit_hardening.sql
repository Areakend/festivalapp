-- Security-audit hardening (2026-07-18). Fixes the three WARN-level findings
-- from Supabase's security advisor. None of these are reachable by the app's
-- own code paths, so this is pure attack-surface reduction with no client
-- impact:
--
-- 1. Trigger functions were executable through PostgREST's /rpc endpoint by
--    anon and authenticated. PostgREST refuses to *run* functions returning
--    `trigger`, but the EXECUTE grant is still surface worth closing — and
--    trigger firing does not check the invoking role's EXECUTE privilege, so
--    revoking cannot break the triggers themselves.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_best_djmag_rank() from public, anon, authenticated;
revoke execute on function public.sync_review_upvote_count() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- 2. set_updated_at had a role-mutable search_path (the other three were
--    already pinned). Pin it so a crafted per-role search_path can never
--    redirect its table references.
alter function public.set_updated_at() set search_path = public;
