import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { CatalogItem } from '@/features/festivals/api';
import { colors, radii, spacing, typography } from '@/theme';

/**
 * One row shared by Home's schedule/wishlist/favorites sections and the
 * friend profile screen: date block · name · meta line · chevron.
 */
export function ScheduleRow({
  item,
  meta,
  locale,
  onPress,
}: {
  item: CatalogItem;
  meta: string;
  locale: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]} onPress={onPress}>
      <View style={styles.date}>
        {item.nextEdition ? (
          <>
            <Text style={styles.day}>{new Date(item.nextEdition.start_date).getDate()}</Text>
            <Text style={styles.month}>
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
      </View>
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
});
