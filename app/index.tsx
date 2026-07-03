import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, spacing, radii, typography } from '@/theme';

/**
 * Temporary welcome screen — proves theme + i18n + router wiring.
 * Milestone 2 replaces this with onboarding → auth flow.
 */
export default function Welcome() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>{t('common.appName')}</Text>
      <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
      <Pressable style={styles.cta}>
        <Text style={styles.ctaLabel}>{t('onboarding.getStarted')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
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
  cta: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  ctaLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.textOnPrimary,
  },
});
