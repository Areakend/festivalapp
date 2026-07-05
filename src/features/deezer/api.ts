import * as AuthSession from 'expo-auth-session';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';
import type { GeneratePlaylistResult } from '@/features/spotify/api';

const DEEZER_APP_ID = process.env.EXPO_PUBLIC_DEEZER_APP_ID!;
// offline_access avoids needing a refresh flow — see supabase/functions/_shared/deezer.ts.
const PERMS = 'basic_access,manage_library,offline_access';

const discovery = {
  authorizationEndpoint: 'https://connect.deezer.com/oauth/auth.php',
};

/**
 * AuthRequest.promptAsync goes through WebBrowser.openAuthSessionAsync under
 * the hood, so it's subject to the same Android quirk documented in
 * src/features/spotify/api.ts: the OS can deliver the festiq://deezer/callback
 * redirect to BOTH the router and back through that promise. Whichever side
 * reads and clears this first "claims" the code.
 */
let pendingDeezerAuth = false;

function claimPendingDeezerAuth() {
  const claimed = pendingDeezerAuth;
  pendingDeezerAuth = false;
  return claimed;
}

export async function completeDeezerAuthFromDeepLink(code: string) {
  if (!claimPendingDeezerAuth()) return;
  await supabase.functions.invoke('deezer-auth', { body: { code } }).catch(() => {});
}

export interface DeezerConnectionStatus {
  user_id: string;
  deezer_user_id: string;
  created_at: string;
}

/** Whether the signed-in user has linked Deezer (reads the token-free status view). */
export function useDeezerConnection() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['deezer-connection', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deezer_connection_status')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as DeezerConnectionStatus | null;
    },
  });
}

/**
 * Opens Deezer's authorize page, then hands the returned code to the
 * deezer-auth Edge Function, which exchanges it server-side (where the
 * app secret lives) and stores the resulting token.
 */
export function useConnectDeezer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'festiq', path: 'deezer/callback' });
      const request = new AuthSession.AuthRequest({
        clientId: DEEZER_APP_ID,
        scopes: [],
        redirectUri,
        usePKCE: false,
        responseType: AuthSession.ResponseType.Code,
        extraParams: { perms: PERMS },
      });
      pendingDeezerAuth = true;
      const result = await request.promptAsync(discovery);
      if (result.type !== 'success') {
        claimPendingDeezerAuth();
        return; // user cancelled — not an error
      }

      // If the callback screen already claimed and exchanged this code (the
      // Android deep-link race above), don't send it a second time.
      if (!claimPendingDeezerAuth()) return;

      const { error } = await supabase.functions.invoke('deezer-auth', {
        body: { code: result.params.code },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['deezer-connection'] });
    },
  });
}

export function useDisconnectDeezer() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('deezer_connections').delete().eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['deezer-connection'] });
    },
  });
}

export function useGeneratePlaylistDeezer() {
  return useMutation({
    mutationFn: async ({ festivalId, editionId }: { festivalId: string; editionId: string }) => {
      const { data, error } = await supabase.functions.invoke<GeneratePlaylistResult>(
        'generate-playlist-deezer',
        { body: { festivalId, editionId } },
      );
      if (error) throw error;
      return data!;
    },
  });
}
