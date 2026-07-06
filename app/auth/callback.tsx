import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { completeGoogleAuthFromDeepLink } from '@/features/auth/api';
import { colors } from '@/theme';

/**
 * Deep-link target for the Google OAuth redirect (festiq://auth/callback).
 * Normally signInWithGoogle's WebBrowser.openAuthSessionAsync captures the
 * redirect before the OS ever routes here, but on some Android setups the
 * OS delivers it straight to the router instead — so this screen finishes
 * the code exchange itself.
 *
 * No manual navigation here: this screen lives in the root layout's
 * signed-out protected group (same as the sign-in screen), so once the
 * exchange sets the session, that guard flips and the stack falls back to
 * (tabs) on its own — the same mechanism that already navigates away from
 * the sign-in screen on a normal login.
 */
export default function AuthCallbackScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    void (async () => {
      if (typeof code === 'string') {
        const { error } = await completeGoogleAuthFromDeepLink(code);
        if (error) {
          Alert.alert('Google', error);
        }
      }
    })();
  }, [code]);

  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}
    >
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
