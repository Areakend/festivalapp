import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography } from '@/theme';

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

/**
 * transparent = Strava-style sticker: no background at all, meant to be
 * downloaded as a PNG and layered over the user's own story/photo.
 * photo = the user's own picture as background, with a dark scrim so the
 * text stays readable.
 */
export type CardBackground =
  | { mode: 'gradient'; theme: CardTheme }
  | { mode: 'photo'; uri: string }
  | { mode: 'transparent' };

export type CardAlign = 'left' | 'center' | 'right';

export type StoryCardProps = {
  background: CardBackground;
  align: CardAlign;
  festivalName: string;
  /** Pre-formatted "flag city, country" line — null when the user hid it. */
  metaLine: string | null;
  /** Pre-formatted day+month (no year) — null when hidden or unavailable. */
  dateLabel: string | null;
  /** [] when hidden or none selected. */
  topArtists: string[];
  /** [] when hidden or none. */
  friendNames: string[];
  /** Whether the "made with Mainstage" pill shows (the only branding left). */
  showFooter: boolean;
} & (
  | {
      kind: 'next';
      daysUntil: number;
      happeningNow: boolean;
    }
  | {
      kind: 'last';
      year: number;
      /** null when hidden or no review. */
      rating: number | null;
      /** Festivals attended in `year` — null when hidden or zero. */
      yearCount: number | null;
    }
);

const ALIGN_ITEMS: Record<CardAlign, 'flex-start' | 'center' | 'flex-end'> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

/**
 * Instagram-story-shaped (9:16) story card, captured to a PNG by the share
 * screen. Poster-style: no header branding, the festival name is the hero,
 * and the only brand mark is the footer pill. Every block is optional —
 * the screen passes null/[] for anything the user toggled off. dateLabel
 * is deliberately day+month only (no year — it's minor context, not
 * worth a prominent slot) and sits inline with the rest of the body
 * rather than as a standalone header element.
 */
export const StoryCard = forwardRef<View, StoryCardProps>((props, ref) => {
  const { t } = useTranslation();
  const overPhoto = props.background.mode !== 'gradient';
  // Over an arbitrary photo (or once the PNG is layered on one), text needs
  // its own contrast: soft shadow + darker pills instead of white-glass ones.
  const shadow = overPhoto ? styles.textShadow : null;
  const pillTone = overPhoto ? styles.pillDark : null;
  const alignItems = ALIGN_ITEMS[props.align];
  const textAlign = props.align;

  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      {props.background.mode === 'gradient' && (
        <LinearGradient
          colors={CARD_THEMES[props.background.theme]}
          style={StyleSheet.absoluteFill}
        />
      )}
      {props.background.mode === 'photo' && (
        <>
          <Image
            source={{ uri: props.background.uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}

      <View style={[styles.body, { alignItems }]}>
        {props.kind === 'next' && (
          <Text style={[styles.hero, shadow, { textAlign }]}>
            {props.happeningNow ? t('share.card.happeningNow') : `J-${props.daysUntil}`}
          </Text>
        )}

        <Text style={[styles.festivalName, shadow, { textAlign }]} numberOfLines={3}>
          {props.festivalName}
        </Text>
        {props.metaLine != null && (
          <Text style={[styles.meta, shadow, { textAlign }]}>{props.metaLine}</Text>
        )}
        {props.dateLabel != null && (
          <Text style={[styles.meta, shadow, { textAlign }]}>{props.dateLabel}</Text>
        )}

        {props.kind === 'last' && (props.rating != null || props.yearCount != null) && (
          <View style={[styles.badgeRow, { justifyContent: alignItems }]}>
            {props.rating != null && (
              <View style={[styles.badge, pillTone]}>
                <Ionicons name="star" size={14} color={colors.rating} />
                <Text style={styles.badgeText}>
                  {t('share.card.myRating')} {props.rating.toFixed(0)}/20
                </Text>
              </View>
            )}
            {props.yearCount != null && (
              <View style={[styles.badge, pillTone]}>
                <Ionicons name="trophy" size={13} color={colors.textOnPrimary} />
                <Text style={styles.badgeText}>
                  {t('share.card.festivalsThisYear', { count: props.yearCount, year: props.year })}
                </Text>
              </View>
            )}
          </View>
        )}

        {props.topArtists.length > 0 && (
          <View style={[styles.block, { alignItems }]}>
            <Text style={[styles.blockLabel, shadow]}>{t('share.card.topArtists')}</Text>
            <Text style={[styles.blockText, shadow, { textAlign }]}>
              {props.topArtists.slice(0, 5).join(' · ')}
            </Text>
          </View>
        )}

        {props.friendNames.length > 0 && (
          <View style={[styles.block, { alignItems }]}>
            <Text style={[styles.blockLabel, shadow]}>
              {props.kind === 'next' ? t('share.card.with') : t('share.card.crew')}
            </Text>
            <Text style={[styles.blockText, shadow, { textAlign }]}>
              {props.friendNames.slice(0, 5).join(', ')}
            </Text>
          </View>
        )}
      </View>

      {props.showFooter && (
        <View style={[styles.footer, { alignItems }]}>
          <View style={[styles.footerPill, pillTone]}>
            <Ionicons name="sparkles" size={13} color={colors.textOnPrimary} />
            <Text style={styles.footerText}>{t('share.card.footer')}</Text>
          </View>
        </View>
      )}
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
    justifyContent: 'flex-end',
  },
  body: { gap: spacing.sm },
  hero: {
    fontFamily: typography.fonts.heading,
    fontSize: 56,
    lineHeight: 60,
    color: colors.textOnPrimary,
    textTransform: 'uppercase',
  },
  festivalName: {
    fontFamily: typography.fonts.heading,
    fontSize: 34,
    lineHeight: 38,
    color: colors.textOnPrimary,
    textTransform: 'uppercase',
  },
  meta: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: 'rgba(255,255,255,0.9)',
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
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.textOnPrimary,
  },
  block: { marginTop: spacing.md, gap: 2 },
  blockLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  blockText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textOnPrimary,
  },
  footer: { marginTop: spacing.lg },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footerText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textOnPrimary,
  },
  pillDark: { backgroundColor: 'rgba(0,0,0,0.45)' },
  textShadow: {
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
