import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/theme';

/** Welcome / onboarding entry point. */
export default function Welcome() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen scroll={false}>
      <View style={styles.hero}>
        <Text style={styles.logo}>{t('common.appName')}</Text>
        <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
      </View>
      <View style={styles.actions}>
        <Button label={t('onboarding.getStarted')} onPress={() => router.push('/sign-up')} />
        <Button
          label={t('auth.haveAccount')}
          variant="ghost"
          onPress={() => router.push('/sign-in')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  logo: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.display,
    color: colors.primary,
  },
  tagline: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  actions: { gap: spacing.sm },
});
