import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/features/auth/api';
import { useSessionStore } from '@/features/auth/session-store';
import { colors, spacing, typography } from '@/theme';
import type { Profile } from '@/types/domain';

/**
 * Minimal profile for M2: proves the full auth loop (profile row auto-created
 * by DB trigger on signup) and offers sign-out.
 * M4 adds stats, editing, language switcher and Spotify status.
 */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const session = useSessionStore((s) => s.session);

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user.id],
    enabled: !!session,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session!.user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={styles.name}>{profile?.display_name ?? '…'}</Text>
        <Text style={styles.email}>{session?.user.email}</Text>
      </View>
      <Button label={t('auth.signOut')} variant="secondary" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  name: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
  },
  email: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
