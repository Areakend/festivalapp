import * as AuthSession from 'expo-auth-session';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!;
const SCOPES = ['playlist-modify-public', 'playlist-modify-private'];

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
};

/**
 * AuthRequest.promptAsync also goes through WebBrowser.openAuthSessionAsync
 * under the hood, so it's subject to the same Android quirk as Google sign-in:
 * the OS can deliver the festiq://spotify/callback redirect straight to the
 * router instead of back through that promise. The codeVerifier only lives
 * in memory on the AuthRequest instance, so we stash it here while a request
 * is in flight so the callback screen can finish the exchange itself.
 */
let pendingSpotifyAuth: { codeVerifier: string; redirectUri: string } | null = null;

export async function completeSpotifyAuthFromDeepLink(code: string) {
  if (!pendingSpotifyAuth) return;
  const { codeVerifier, redirectUri } = pendingSpotifyAuth;
  pendingSpotifyAuth = null;
  await supabase.functions
    .invoke('spotify-auth', { body: { code, codeVerifier, redirectUri } })
    .catch(() => {});
}

export interface SpotifyConnectionStatus {
  user_id: string;
  spotify_user_id: string;
  created_at: string;
}

/** Whether the signed-in user has linked Spotify (reads the token-free status view). */
export function useSpotifyConnection() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['spotify-connection', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spotify_connection_status')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as SpotifyConnectionStatus | null;
    },
  });
}

/**
 * Opens Spotify's authorize page (PKCE, no client secret on-device), then
 * hands the returned code + verifier to the spotify-auth Edge Function,
 * which exchanges it server-side (where the client secret lives) and
 * stores the resulting tokens.
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
      // Populate codeVerifier up front so it's available to stash before we
      // hand off to the browser session.
      await request.makeAuthUrlAsync(discovery);
      pendingSpotifyAuth = { codeVerifier: request.codeVerifier!, redirectUri };
      let result;
      try {
        result = await request.promptAsync(discovery);
      } finally {
        pendingSpotifyAuth = null;
      }
      if (result.type !== 'success') return; // user cancelled — not an error

      const { error } = await supabase.functions.invoke('spotify-auth', {
        body: { code: result.params.code, codeVerifier: request.codeVerifier, redirectUri },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['spotify-connection'] });
    },
  });
}

export function useDisconnectSpotify() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('spotify_connections').delete().eq('user_id', userId);
      if (error) throw error;
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
      if (error) throw error;
      return data!;
    },
  });
}
