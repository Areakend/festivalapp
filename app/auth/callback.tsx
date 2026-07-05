import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { completeGoogleAuthFromDeepLink } from '@/features/auth/api';
import { useSessionStore } from '@/features/auth/session-store';
import { colors, spacing, typography } from '@/theme';

/**
 * Deep-link target for the Google OAuth redirect (festiq://auth/callback).
 * Normally signInWithGoogle's WebBrowser.openAuthSessionAsync captures the
 * redirect before the OS ever routes here, but on some Android setups the
 * OS delivers it straight to the router instead — so this screen finishes
 * the code exchange itself.
 *
 * Navigation is driven by the session store rather than fired blindly after
 * the exchange: a replace() issued in the same tick as the auth-guard flip
 * can get swallowed by the navigator re-rooting (users reported staying on
 * this spinner forever while actually being signed in). An escape-hatch
 * button appears after a few seconds just in case.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const { code } = useLocalSearchParams<{ code?: string }>();
  const handled = useRef(false);
  const [exchangeDone, setExchangeDone] = useState(false);
  const [showEscape, setShowEscape] = useState(false);

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
      setExchangeDone(true);
    })();

    const escapeTimer = setTimeout(() => setShowEscape(true), 5_000);
    return () => clearTimeout(escapeTimer);
  }, [code]);

  // Leave once the session state has settled: signed in (guard flipped
  // underneath us) or exchange finished without one (back to sign-in).
  useEffect(() => {
    if (session || exchangeDone) {
      const t = setTimeout(() => router.replace('/'), 50);
      return () => clearTimeout(t);
    }
  }, [session, exchangeDone, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      {showEscape && (
        <View style={styles.escape}>
          <Text style={styles.escapeText}>…</Text>
          <Button label="Continuer" onPress={() => router.replace('/')} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.xl,
  },
  escape: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xxl },
  escapeText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
