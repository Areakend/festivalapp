import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';

/**
 * Deep-link target for OAuth redirects (festiq://auth/callback). Normally
 * signInWithGoogle's WebBrowser.openAuthSessionAsync captures the redirect
 * before the OS ever routes here. But on some Android setups the OS delivers
 * the festiq:// redirect straight to the router instead (bypassing that
 * browser session), leaving that promise pending forever. So this screen
 * does the code exchange itself too — exchangeCodeForSession errors if the
 * code was already consumed by the other path, which we ignore.
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
        await supabase.auth.exchangeCodeForSession(code).catch(() => {});
      }
      router.replace('/');
    })();
  }, [code, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
