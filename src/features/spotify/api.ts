import * as AuthSession from 'expo-auth-session';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { functionsErrorMessage } from '@/lib/functions';

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!;
const SCOPES = ['playlist-modify-public', 'playlist-modify-private'];

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
};

/**
 * Curator-only reconnect flow (e.g. switching the Spotify account that owns
 * the shared playlists) — see spotify-auth Edge Function, which rejects any
 * non-curator caller server-side. Kept minimal on purpose: no disconnect or
 * per-user import UI, since neither applies now that playlists are curated
 * centrally (see generate-playlist).
 */
let pendingSpotifyAuth: { codeVerifier: string; redirectUri: string } | null = null;

function claimPendingSpotifyAuth() {
  const claimed = pendingSpotifyAuth;
  pendingSpotifyAuth = null;
  return claimed;
}

/**
 * Returns null when this deep link wasn't ours to handle (the other path
 * already claimed it), or a { error } object describing what happened —
 * error is undefined on success. Never throws: the caller always has
 * something to show the user instead of a silent failure.
 */
export async function completeSpotifyAuthFromDeepLink(
  code: string,
): Promise<{ error?: string } | null> {
  const claimed = claimPendingSpotifyAuth();
  if (!claimed) return null;
  const { error } = await supabase.functions.invoke('spotify-auth', {
    body: { code, codeVerifier: claimed.codeVerifier, redirectUri: claimed.redirectUri },
  });
  return { error: error ? await functionsErrorMessage(error) : undefined };
}

/**
 * Opens Spotify's authorize page (PKCE, no client secret on-device), then
 * hands the returned code + verifier to the spotify-auth Edge Function,
 * which exchanges it server-side (where the client secret lives) and
 * stores the resulting tokens against the signed-in user.
 */
export function useConnectSpotify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'festiq', path: 'spotify/callback' });
      const request = new AuthSession.AuthRequest({
        clientId: SPOTIFY_CLIENT_ID,
        scopes: SCOPES,
        redirectUri,
        usePKCE: true,
        responseType: AuthSession.ResponseType.Code,
      });
      await request.makeAuthUrlAsync(discovery);
      pendingSpotifyAuth = { codeVerifier: request.codeVerifier!, redirectUri };
      const result = await request.promptAsync(discovery);
      if (result.type !== 'success') {
        claimPendingSpotifyAuth();
        return;
      }

      if (!claimPendingSpotifyAuth()) return;

      const { error } = await supabase.functions.invoke('spotify-auth', {
        body: { code: result.params.code, codeVerifier: request.codeVerifier, redirectUri },
      });
      if (error) throw new Error(await functionsErrorMessage(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['spotify-connection'] });
    },
  });
}

export interface GeneratePlaylistResult {
  playlistUrl: string;
  playlistId: string;
  totalArtists: number;
  matchedArtists: number;
  totalTracks: number;
  skippedArtists: string[];
}

export function useGeneratePlaylist() {
  return useMutation({
    mutationFn: async ({ festivalId, editionId }: { festivalId: string; editionId: string }) => {
      const { data, error } = await supabase.functions.invoke<GeneratePlaylistResult>('generate-playlist', {
        body: { festivalId, editionId },
      });
      if (error) throw new Error(await functionsErrorMessage(error));
      return data!;
    },
  });
}

export interface FestivalPlaylistCache {
  spotify_playlist_id: string;
  spotify_playlist_url: string;
  total_artists: number;
  matched_artists: number;
  total_tracks: number;
  skipped_artists: string[];
}

/**
 * One shared public playlist per edition (Option 1: generated once under
 * the app's own curator Spotify account instead of every user connecting
 * their own — see generate-playlist). Reads the cache table directly so a
 * returning user sees "Open playlist" immediately, with no Edge Function
 * round trip needed until someone has to generate it for the first time.
 */
export function useFestivalPlaylistCache(editionId: string | undefined) {
  return useQuery({
    queryKey: ['festival-playlist-cache', editionId],
    enabled: !!editionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('festival_playlists')
        .select('spotify_playlist_id, spotify_playlist_url, total_artists, matched_artists, total_tracks, skipped_artists')
        .eq('edition_id', editionId)
        .maybeSingle();
      if (error) throw error;
      return data as FestivalPlaylistCache | null;
    },
  });
}
