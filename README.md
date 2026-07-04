# Mainstage

Track every beat. Une app mobile (iOS/Android) pour suivre ses festivals : catalogue mondial, notes /20 avec sous-catégories, classements communautaires, DJ Mag Top 100, amis, et génération de playlists Spotify depuis les lineups.

## Stack

- **Frontend** : Expo / React Native + TypeScript, Expo Router, TanStack Query, Zustand, i18next (EN/FR/NL/DE/ES)
- **Backend** : Supabase (Postgres + RLS, Auth, Edge Functions)
- **Distribution** : EAS Build (APK Android) + EAS Update (mises à jour OTA automatiques à chaque push sur `main`)

## Développement

```bash
npm install
cp .env.example .env   # remplir les clés Supabase/Spotify
npx expo start
```
