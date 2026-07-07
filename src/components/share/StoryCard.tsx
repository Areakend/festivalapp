import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';

export type StoryCardProps =
  | {
      kind: 'next';
      festivalName: string;
      city: string | null;
      country: string;
      daysUntil: number;
      happeningNow: boolean;
      dateLabel: string;
      friendNames: string[];
      topArtists: string[];
    }
  | {
      kind: 'last';
      festivalName: string;
      city: string | null;
      country: string;
      year: number;
      rating: number | null;
      crewNames: string[];
      topArtists: string[];
    };

/**
 * Instagram-story-shaped (9:16) share card — captured to an image by the
 * screen that renders it (see app/share/[kind].tsx) and handed to the OS
 * share sheet. Deliberately punchy/branded (Strava-post style): the goal is
 * for it to look good enough that someone who isn't a user yet gets curious
 * about the app it came from.
 */
export const StoryCard = forwardRef<View, StoryCardProps>((props, ref) => {
  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <LinearGradient
        colors={[colors.primary, '#2A0F4A', colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.brand}>
        <Ionicons name="sparkles" size={16} color={colors.textOnPrimary} />
        <Text style={styles.brandText}>MAINSTAGE</Text>
      </View>

      <View style={styles.body}>
        {props.kind === 'next' ? (
          <>
            <Text style={styles.eyebrow}>MON PROCHAIN FESTIVAL</Text>
            {props.happeningNow ? (
              <Text style={styles.hero}>EN CE MOMENT</Text>
            ) : (
              <>
                <Text style={styles.hero}>J-{props.daysUntil}</Text>
              </>
            )}
          </>
        ) : (
          <>
            <Text style={styles.eyebrow}>J'Y ÉTAIS EN {props.year}</Text>
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

        {props.kind === 'last' && props.rating != null && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={16} color={colors.rating} />
            <Text style={styles.ratingText}>{props.rating.toFixed(0)}/20</Text>
          </View>
        )}

        {props.topArtists.length > 0 && (
          <View style={styles.artistsBlock}>
            <Text style={styles.blockLabel}>TÊTES D'AFFICHE</Text>
            <Text style={styles.artistsText}>{props.topArtists.slice(0, 5).join(' · ')}</Text>
          </View>
        )}

        {(props.kind === 'next' ? props.friendNames : props.crewNames).length > 0 && (
          <View style={styles.artistsBlock}>
            <Text style={styles.blockLabel}>
              {props.kind === 'next' ? 'AVEC' : 'LE CREW'}
            </Text>
            <Text style={styles.artistsText}>
              {(props.kind === 'next' ? props.friendNames : props.crewNames).slice(0, 5).join(', ')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Suis tes festivals sur Mainstage</Text>
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
  },
  hero: {
    fontFamily: typography.fonts.heading,
    fontSize: 56,
    lineHeight: 60,
    color: colors.textOnPrimary,
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
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  ratingText: {
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
  },
  artistsText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textOnPrimary,
  },
  footer: { alignItems: 'center' },
  footerText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.7)',
  },
});
