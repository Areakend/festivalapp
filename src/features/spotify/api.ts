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
 * supabase-js's FunctionsHttpError message is always the generic
 * "Edge Function returned a non-2xx status code" — the actual reason the
 * spotify-auth function rejected the request (bad Spotify credentials,
 * code/verifier mismatch, etc.) is in the response body on error.context.
 */
async function functionsErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: Response }).context;
  if (context) {
    try {
      const body = await context.clone().json();
      if (typeof body?.error === 'string') return body.error;
    } catch {
      // fall through to the generic message below
    }
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * AuthRequest.promptAsync also goes through WebBrowser.openAuthSessionAsync
 * under the hood, so it's subject to the same Android quirk as Google sign-in:
 * the OS can deliver the festiq://spotify/callback redirect to BOTH the
 * router and back through that promise. The codeVerifier only lives in
 * memory on the AuthRequest instance, so we stash it here while a request is
 * in flight — whichever side (this module's own flow, or the callback
 * screen) reads and clears it first "claims" the code, so the authorization
 * code never gets sent to Spotify's token endpoint twice (which fails with
 * invalid_grant, since codes are single-use).
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
      const result = await request.promptAsync(discovery);
      if (result.type !== 'success') {
        claimPendingSpotifyAuth();
        return; // user cancelled — not an error
      }

      // If the callback screen already claimed and exchanged this code (the
      // Android deep-link race above), don't send it to Spotify a second
      // time — it would fail with invalid_grant since codes are single-use.
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
