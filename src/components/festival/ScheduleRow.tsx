import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { CatalogItem } from '@/features/festivals/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag, countryName } from '@/utils/format';
import { openInMaps } from '@/utils/maps';

/**
 * One row shared by Home's schedule/wishlist/favorites sections and the
 * friend profile screen: date block · name · meta line · country/rating
 * line · maps shortcut · chevron. The extra line helps planning — seeing
 * the community score and country without opening every festival — so it's
 * worth the added row height everywhere this is used.
 */
export function ScheduleRow({
  item,
  meta,
  locale,
  accentColor,
  onPress,
}: {
  item: CatalogItem;
  meta: string;
  locale: string;
  /** Defaults to the "planned" blue — only the planning calendar (which
   *  mixes planned/wishlist/favorite in one list) needs to override this
   *  per row. */
  accentColor?: string;
  onPress: () => void;
}) {
  const { festival, stats } = item;
  const hasCommunity = stats != null && stats.rating_count > 0;
  const hasLocation = !!(festival.venue || festival.city || festival.country);

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]} onPress={onPress}>
      <View style={styles.date}>
        {item.nextEdition ? (
          <>
            <Text style={styles.day}>{new Date(item.nextEdition.start_date).getDate()}</Text>
            <Text style={[styles.month, accentColor && { color: accentColor }]}>
              {new Date(item.nextEdition.start_date)
                .toLocaleDateString(locale, { month: 'short' })
                .replace('.', '')}
            </Text>
          </>
        ) : (
          <Text style={styles.tbc}>?</Text>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.festival.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
        <View style={styles.infoLine}>
          <Text style={styles.infoText} numberOfLines={1}>
            {countryFlag(festival.country)} {countryName(festival.country, locale)}
          </Text>
          {hasCommunity && (
            <View style={styles.rating}>
              <Ionicons name="star" size={11} color={colors.rating} />
              <Text style={styles.ratingText}>
                {Number(stats.avg_rating).toFixed(1)}/20
                <Text style={styles.ratingCount}> ({stats.rating_count})</Text>
              </Text>
            </View>
          )}
        </View>
      </View>
      {hasLocation && (
        <Pressable
          onPress={() => openInMaps(festival, locale)}
          hitSlop={10}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Ionicons name="location-outline" size={18} color={colors.primary} />
        </Pressable>
      )}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  date: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
    lineHeight: 22,
  },
  month: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.statusPlanned,
    textTransform: 'uppercase',
  },
  tbc: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
  },
  body: { flex: 1, gap: 2 },
  name: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  meta: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  infoText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    flex: 1,
  },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  ratingText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.xs,
    color: colors.rating,
  },
  ratingCount: {
    fontFamily: typography.fonts.body,
    color: colors.textMuted,
  },
});
