import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';
import type { Festival, FestivalCommunityStats } from '@/types/domain';

interface FestivalCardProps {
  festival: Festival;
  stats?: FestivalCommunityStats;
}

/** Catalog card: cover placeholder, name, location, rating and DJ Mag badge. */
export function FestivalCard({ festival, stats }: FestivalCardProps) {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() =>
        router.push({ pathname: '/festival/[slug]', params: { slug: festival.slug } })
      }
    >
      {/* Cover placeholder until real images land (M5 asset pass) */}
      <View style={styles.cover}>
        <Text style={styles.coverLetter}>{festival.name.charAt(0)}</Text>
        {festival.best_djmag_rank != null && (
          <View style={styles.rankBadge}>
            <Ionicons name="trophy" size={12} color={colors.rating} />
            <Text style={styles.rankText}>#{festival.best_djmag_rank}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {festival.name}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {countryFlag(festival.country)} {festival.city ?? festival.country}
        </Text>
        <View style={styles.footer}>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color={colors.rating} />
            <Text style={styles.ratingText}>
              {stats && stats.rating_count > 0 ? stats.avg_rating.toFixed(1) : '–'}
            </Text>
            {stats && stats.rating_count > 0 && (
              <Text style={styles.ratingCount}>({stats.rating_count})</Text>
            )}
          </View>
          <Text style={styles.genres} numberOfLines={1}>
            {festival.genres.slice(0, 3).join(' · ')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  cover: {
    width: 92,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverLetter: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.display,
    color: colors.primary,
  },
  rankBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.background,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  rankText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.xs,
    color: colors.rating,
  },
  body: { flex: 1, padding: spacing.md, gap: spacing.xs },
  name: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  location: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  ratingCount: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  genres: {
    flex: 1,
    textAlign: 'right',
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
});
