import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { completeDeezerAuthFromDeepLink } from '@/features/deezer/api';
import { colors } from '@/theme';

/**
 * Deep-link target for the Deezer OAuth redirect (festiq://deezer/callback).
 * See app/spotify/callback.tsx for why this screen also finishes the
 * exchange itself: on some Android setups the OS delivers the redirect
 * straight to the router instead of the promptAsync promise.
 */
export default function DeezerCallbackScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      if (typeof code === 'string') {
        await completeDeezerAuthFromDeepLink(code);
        void queryClient.invalidateQueries({ queryKey: ['deezer-connection'] });
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
