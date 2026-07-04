import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { colors, radii, spacing, typography } from '@/theme';
import { ratingColor } from '@/components/ui/RatingBar';
import type { Festival, FestivalCommunityStats } from '@/types/domain';

interface FestivalPosterCardProps {
  festival: Festival;
  stats?: FestivalCommunityStats;
}

/** Compact vertical card for horizontal carousels (home sections). */
export function FestivalPosterCard({ festival, stats }: FestivalPosterCardProps) {
  const router = useRouter();
  const rated = stats && stats.rating_count > 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={() =>
        router.push({ pathname: '/festival/[slug]', params: { slug: festival.slug } })
      }
    >
      <View style={styles.cover}>
        {festival.cover_image_url ? (
          <Image
            source={{ uri: festival.cover_image_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Text style={styles.coverLetter}>{festival.name.charAt(0)}</Text>
        )}
        {rated && (
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: ratingColor(stats.avg_rating) }]}>
              {stats.avg_rating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {festival.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 130, gap: spacing.sm },
  cover: {
    height: 150,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverLetter: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.display,
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: `${colors.background}E6`,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.xs,
  },
  name: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
});
