import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { completeSpotifyAuthFromDeepLink } from '@/features/spotify/api';
import { colors } from '@/theme';

/**
 * Deep-link target for the Spotify OAuth redirect (festiq://spotify/callback).
 * Normally AuthRequest.promptAsync captures the redirect before Expo Router
 * ever sees it. But on some Android setups the OS delivers it straight to
 * the router instead, leaving that promise pending forever — so this screen
 * finishes the exchange itself when that happens (a no-op if the other path
 * already won the race, since pendingSpotifyAuth would already be cleared).
 */
export default function SpotifyCallbackScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      if (typeof code === 'string') {
        await completeSpotifyAuthFromDeepLink(code);
        void queryClient.invalidateQueries({ queryKey: ['spotify-connection'] });
      }
      router.replace('/profile');
    })();
  }, [code, queryClient, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
