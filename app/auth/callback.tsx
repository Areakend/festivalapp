import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { completeGoogleAuthFromDeepLink } from '@/features/auth/api';
import { colors } from '@/theme';

/**
 * Deep-link target for the Google OAuth redirect (festiq://auth/callback).
 * Normally signInWithGoogle's WebBrowser.openAuthSessionAsync captures the
 * redirect before the OS ever routes here, but on some Android setups the
 * OS delivers it straight to the router instead, leaving that promise
 * pending forever — so this screen finishes the code exchange itself (with
 * a timeout and a visible error, never a silent infinite spinner).
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      if (typeof code === 'string') {
        const { error } = await completeGoogleAuthFromDeepLink(code);
        if (error) {
          Alert.alert('Google', error);
        }
      }
      // On success the session guard flips to the signed-in stack on its
      // own, but this always-mounted screen would stay on top — step off.
      router.replace('/');
    })();
  }, [code, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
