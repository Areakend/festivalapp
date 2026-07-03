# Festiq 🎪

**Track every beat.** A cross-platform (iOS + Android) festival tracking app — think Letterboxd × Strava × Untappd, for festival lovers.

Log the festivals you've attended, rate and review them, climb the DJ Mag Top 100, and turn any lineup into a Spotify playlist.

## Features

- 🔐 **Secure auth** — email/password + Google sign-in via Supabase Auth (passwords are never stored in plain text anywhere; sessions live in the iOS Keychain / Android Keystore)
- 🎪 **Festival catalog** — 116 festivals seeded from the real DJ Mag Top 100 lists, with search and genre/country/Top-100 filters
- ✅ **Personal tracking** — attended / planned / wishlist / favorite
- ⭐ **Reviews** — overall rating + 6 sub-ratings (lineup, production, sound, organization, atmosphere, value)
- 🏆 **DJ Mag Top 100** — real 2024–2026 rankings with a personal progress bar ("You have attended X/100")
- 📊 **Community rankings** — Bayesian-weighted so low-vote festivals don't dominate
- 🎧 **Spotify playlist generator** — builds a playlist from a festival's lineup; creates it in your Spotify account when connected, or shows a preview when not
- 🌍 **5 languages** — English, French, Dutch, German, Spanish (device-language detection + in-app switcher)
- 🌙 **Dark-first design** — violet/neon-pink festival aesthetic, Space Grotesk + Inter

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | Expo (React Native) + TypeScript + Expo Router | one codebase for iOS/Android, file-based routing, typed routes |
| Server state | TanStack Query | caching, retries, invalidation |
| Client state | Zustand | tiny; only the session lives here |
| Backend | Supabase (Postgres + Auth + Edge Functions) | managed auth with bcrypt, RLS, serverless functions for secrets |
| Forms | react-hook-form + Zod | validation with i18n-ready messages |
| i18n | i18next + expo-localization | 5 locales, device detection |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full rationale.

## Getting started

### 1. Prerequisites

- Node 20+, a [Supabase](https://supabase.com) project (free tier is fine)
- The **Expo Go** app on your phone (or a simulator)

### 2. Install & configure

```bash
npm install
cp .env.example .env   # then fill in the values below
```

| Variable | Where to find it |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API (anon/publishable key) |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` | [Spotify dashboard](https://developer.spotify.com/dashboard) (see Spotify section) |

### 3. Database

Run these files against your Supabase project (SQL editor, or `psql`/CLI), in order:

1. `supabase/migrations/20260703120000_initial_schema.sql` — tables, RLS, triggers, views
2. `supabase/seed/seed.sql` then `supabase/seed/djmag_top100.sql` — 116 festivals + real DJ Mag 2024–2026 rankings

### 4. Auth providers (Supabase dashboard)

- **Email**: enabled by default. For local testing, disable *Confirm email* (Authentication → Providers → Email) to avoid the built-in SMTP rate limit.
- **Google**: create an OAuth *Web application* client in Google Cloud with redirect URI `https://<project>.supabase.co/auth/v1/callback`, paste its client ID/secret into Authentication → Providers → Google, and add `festiq://auth/callback` to Authentication → URL Configuration → Redirect URLs.
  ⚠️ Google sign-in needs a dev build (custom scheme) — in Expo Go, use email/password.

### 5. Run

```bash
npx expo start          # scan the QR with Expo Go (same WiFi)
```

## Spotify integration

The client secret never ships in the app. Everything sensitive runs in **Supabase Edge Functions**:

```
app ──PKCE consent──▶ Spotify ──code──▶ app ──code+verifier──▶ spotify-auth (Edge Fn)
                                                                │ exchanges code, stores tokens
                                                                ▼ (service role, RLS-protected)
app ──festival+edition──▶ generate-playlist (Edge Fn) ──▶ searches artists, picks top tracks,
                                                          round-robin fair distribution, dedup,
                                                          creates playlist OR returns preview
```

Setup:

```bash
# 1. Create an app at developer.spotify.com/dashboard
#    Redirect URIs: festiq://spotify-auth  (+ the exp:// URI printed in dev)
# 2. Put the Client ID in .env (EXPO_PUBLIC_SPOTIFY_CLIENT_ID)
# 3. Deploy the functions with the secret:
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=xxx
npx supabase functions deploy spotify-auth generate-playlist
```

Not connected to Spotify? The generator still works: it returns a **preview tracklist** using an app-only token, and offers the connect button to save it for real.

## Security model

- Passwords: delegated to Supabase Auth (bcrypt server-side) — never touch the app or DB tables
- Sessions: stored via expo-secure-store (Keychain/Keystore), auto-refreshed
- RLS on every table: catalog is world-readable/service-role-writable; user rows enforce `auth.uid() = user_id` on every operation
- Spotify tokens: written only by Edge Functions with the service role; the app reads a token-free status view
- Validation: Zod on forms + Postgres CHECK constraints (rating ranges, comment length)

## Project structure

```
app/                  routes (thin screens only)
src/
  components/         design-system components (Button, Chip, StarRating…)
  features/           auth / festivals / reviews / profile / spotify (hooks + API)
  i18n/               i18next setup + en/fr/nl/de/es locales
  lib/                supabase client
  theme/              design tokens
supabase/
  migrations/         schema, RLS, triggers, views
  seed/               seed.sql + djmag_top100.sql (real 2024–2026 lists)
  functions/          spotify-auth, generate-playlist (Deno Edge Functions)
```

## Production hardening (TODO / phase 2)

- [ ] EAS dev build + store builds (unlocks Google & Spotify OAuth outside Expo Go)
- [ ] Encrypt Spotify tokens at rest (Supabase Vault / pgsodium)
- [ ] Server-side pagination & full-text search once the catalog grows
- [ ] Festival cover images (Supabase Storage) + richer metadata for the 104 imported festivals
- [ ] Review helpful-votes, moderation tooling
- [ ] Password-reset deep link into an in-app "new password" screen
- [ ] Rate limiting on Edge Functions; custom SMTP for auth emails
- [ ] `supabase gen types typescript` for generated DB types
- [ ] E2E tests (Maestro) + unit tests on ranking/formatting utils
