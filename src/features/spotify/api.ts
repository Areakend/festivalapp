import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

/**
 * festiq://spotify-auth in a dev/production build; exp://.../--/spotify-auth
 * in Expo Go. Both must be registered in the Spotify app dashboard.
 */
export const spotifyRedirectUri = makeRedirectUri({ scheme: 'festiq', path: 'spotify-auth' });

/** Token-free connection status (view exposes no secrets). */
export function useSpotifyStatus() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['spotify-status', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spotify_connection_status')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data as { user_id: string; spotify_user_id: string } | null;
    },
  });
}

/**
 * Spotify PKCE OAuth: browser consent → authorization code → exchanged and
 * stored server-side by the `spotify-auth` Edge Function. No secret on device.
 */
export function useSpotifyConnect() {
  const queryClient = useQueryClient();
  const [request, , promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '',
      scopes: ['playlist-modify-public', 'playlist-modify-private'],
      usePKCE: true,
      redirectUri: spotifyRedirectUri,
    },
    discovery,
  );

  const connect = async (): Promise<boolean> => {
    const result = await promptAsync();
    if (result.type !== 'success' || !request?.codeVerifier) return false;

    const { error } = await supabase.functions.invoke('spotify-auth', {
      body: {
        code: result.params.code,
        code_verifier: request.codeVerifier,
        redirect_uri: spotifyRedirectUri,
      },
    });
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ['spotify-status'] });
    return true;
  };

  return { connect, ready: !!request };
}

export interface PlaylistResult {
  mode: 'created' | 'preview';
  playlist_name: string;
  playlist_url?: string;
  total_artists: number;
  matched_artists: number;
  total_tracks: number;
  skipped: string[];
  tracks: { name: string; artist: string }[];
}

export function useGeneratePlaylist() {
  return useMutation({
    mutationFn: async (input: {
      festival_id: string;
      edition_id: string;
      max_tracks?: number;
    }): Promise<PlaylistResult> => {
      const { data, error } = await supabase.functions.invoke('generate-playlist', {
        body: input,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as PlaylistResult;
    },
  });
}
