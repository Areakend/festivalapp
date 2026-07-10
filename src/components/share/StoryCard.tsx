import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';

/**
 * Gradient presets the user can pick from on the share screen — every
 * one fades to the app background so the white text stays readable on
 * the whole card.
 */
export const CARD_THEMES = {
  violet: [colors.primary, '#2A0F4A', colors.background],
  sunset: ['#FF5E5B', '#7A1E3A', colors.background],
  ocean: ['#38BDF8', '#1E3A8A', colors.background],
  forest: ['#34D399', '#065F46', colors.background],
} as const;
export type CardTheme = keyof typeof CARD_THEMES;

export type StoryCardProps = {
  theme?: CardTheme;
  topArtists: string[];
} & (
  | {
      kind: 'next';
      festivalName: string;
      city: string | null;
      country: string;
      daysUntil: number;
      happeningNow: boolean;
      dateLabel: string;
      friendNames: string[];
    }
  | {
      kind: 'last';
      festivalName: string;
      city: string | null;
      country: string;
      year: number;
      rating: number | null;
      /** Total festivals the user has logged — the flex badge (hidden when null). */
      festivalCount: number | null;
      crewNames: string[];
    }
);

/**
 * Instagram-story-shaped (9:16) share card — captured to an image by the
 * screen that renders it (see app/share/[kind].tsx) and handed to the OS
 * share sheet. Deliberately punchy/branded (Strava-post style): the goal is
 * for it to look good enough that someone who isn't a user yet gets curious
 * about the app it came from. Rendered in the app language via i18n.
 */
export const StoryCard = forwardRef<View, StoryCardProps>((props, ref) => {
  const { t } = useTranslation();

  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <LinearGradient colors={CARD_THEMES[props.theme ?? 'violet']} style={StyleSheet.absoluteFill} />

      <View style={styles.brand}>
        <Ionicons name="sparkles" size={16} color={colors.textOnPrimary} />
        <Text style={styles.brandText}>MAINSTAGE</Text>
      </View>

      <View style={styles.body}>
        {props.kind === 'next' ? (
          <>
            <Text style={styles.eyebrow}>{t('share.card.next')}</Text>
            {props.happeningNow ? (
              <Text style={styles.hero}>{t('share.card.happeningNow')}</Text>
            ) : (
              <Text style={styles.hero}>J-{props.daysUntil}</Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.eyebrow}>{t('share.card.wasThere', { year: props.year })}</Text>
            <Text style={styles.hero}>🎉</Text>
          </>
        )}

        <Text style={styles.festivalName} numberOfLines={2}>
          {props.festivalName}
        </Text>
        <Text style={styles.meta}>
          {countryFlag(props.country)} {[props.city, props.country].filter(Boolean).join(', ')}
        </Text>
        {props.kind === 'next' && <Text style={styles.meta}>{props.dateLabel}</Text>}

        {props.kind === 'last' && (props.rating != null || props.festivalCount != null) && (
          <View style={styles.badgeRow}>
            {props.rating != null && (
              <View style={styles.badge}>
                <Ionicons name="star" size={16} color={colors.rating} />
                <Text style={styles.badgeText}>{props.rating.toFixed(0)}/20</Text>
              </View>
            )}
            {props.festivalCount != null && (
              <View style={styles.badge}>
                <Ionicons name="trophy" size={14} color={colors.textOnPrimary} />
                <Text style={styles.badgeText}>
                  {t('share.card.festivalCount', { count: props.festivalCount })}
                </Text>
              </View>
            )}
          </View>
        )}

        {props.topArtists.length > 0 && (
          <View style={styles.artistsBlock}>
            <Text style={styles.blockLabel}>{t('share.card.topArtists')}</Text>
            <Text style={styles.artistsText}>{props.topArtists.slice(0, 5).join(' · ')}</Text>
          </View>
        )}

        {(props.kind === 'next' ? props.friendNames : props.crewNames).length > 0 && (
          <View style={styles.artistsBlock}>
            <Text style={styles.blockLabel}>
              {props.kind === 'next' ? t('share.card.with') : t('share.card.crew')}
            </Text>
            <Text style={styles.artistsText}>
              {(props.kind === 'next' ? props.friendNames : props.crewNames).slice(0, 5).join(', ')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerPill}>
          <Ionicons name="sparkles" size={13} color={colors.textOnPrimary} />
          <Text style={styles.footerText}>{t('share.card.footer')}</Text>
        </View>
      </View>
    </View>
  );
});
StoryCard.displayName = 'StoryCard';

const styles = StyleSheet.create({
  card: {
    width: 320,
    aspectRatio: 9 / 16,
    borderRadius: radii.lg,
    overflow: 'hidden',
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.textOnPrimary,
    letterSpacing: 2,
  },
  body: { gap: spacing.sm },
  eyebrow: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hero: {
    fontFamily: typography.fonts.heading,
    fontSize: 56,
    lineHeight: 60,
    color: colors.textOnPrimary,
    textTransform: 'uppercase',
  },
  festivalName: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.textOnPrimary,
    marginTop: spacing.sm,
  },
  meta: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: 'rgba(255,255,255,0.85)',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.textOnPrimary,
  },
  artistsBlock: { marginTop: spacing.md, gap: 2 },
  blockLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  artistsText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textOnPrimary,
  },
  footer: { alignItems: 'center' },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footerText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textOnPrimary,
  },
});
