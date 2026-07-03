# Festiq — Architecture

## Stack decisions (and why)

| Choice | Reason |
| --- | --- |
| **Expo + Expo Router** | Single codebase iOS/Android, file-based routing gives deep links & typed routes for free, OTA updates later via EAS. |
| **Zustand** (not Redux) | TanStack Query owns all *server* state; only a thin slice of client state remains (session, UI prefs) — Redux would be overkill. |
| **TanStack Query** | Caching, retries, optimistic updates for statuses/reviews. Server state never lives in a store. |
| **Supabase** | Managed Postgres + Auth (bcrypt, never plain text) + RLS + Edge Functions for Spotify secret handling. |
| **i18next** | Initialized before first render, device-language detection via expo-localization, 5 locales shipped. |
| **expo-secure-store** | Session tokens in Keychain/Keystore, never AsyncStorage. |

## Layers

```
app/            → routes only (thin screens, no business logic)
src/features/   → feature logic: hooks, api calls, feature components
src/components/ → shared design-system components (Button, Card, Rating…)
src/lib/        → clients (supabase), pure helpers
src/theme/      → design tokens (single source of truth for colors/spacing/type)
src/i18n/       → i18next setup + locale JSON
src/types/      → domain types
supabase/       → migrations, seed, edge functions
```

Rule of thumb: a file in `app/` may only compose components and call feature
hooks. Anything that touches Supabase lives in `src/features/*/api.ts`.

## Security model

- **Auth**: delegated to Supabase Auth (email/password with bcrypt, Google OAuth).
  The app never sees or stores a password — only the session JWT, kept in
  SecureStore.
- **RLS everywhere**: catalog tables are world-readable / service-role-writable;
  user tables enforce `auth.uid() = user_id` on every operation. The client is
  never trusted for authorization.
- **Spotify**: PKCE OAuth from the app (no secret needed client-side); token
  exchange/refresh and playlist creation run in Supabase Edge Functions where
  the client secret lives (`supabase secrets`). Tokens are stored server-side,
  the app reads only a token-free status view.
- **Validation**: Zod schemas on every form + Postgres CHECK constraints as the
  last line of defense (rating ranges, comment length).

## Community ranking

Plain averages over-reward festivals with 2 ratings of 5.0. We use a Bayesian
average (`festival_community_stats` view):

```
score = (v/(v+m))·R + (m/(v+m))·C     with m = 10, C = global mean
```

A festival needs volume before its own average dominates the prior.

## DJ Mag Top 100

No public API exists, so the list is a curated dataset
(`supabase/seed/djmag_top100.sample.json`) with a documented shape.
`festivals.best_djmag_rank` is denormalized and kept in sync by a DB trigger.

## Milestones

1. ✅ Foundation: config, theme, i18n ×5, schema + RLS + seed
2. Auth (email/password + Google, secure sessions)
3. Catalog, festival detail, personal tracking
4. Reviews, profile stats, DJ Mag section
5. Spotify playlist generation, README, polish
