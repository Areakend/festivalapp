import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { PersonalEvent } from '@/types/domain';
import { colors, radii, spacing, typography } from '@/theme';

/**
 * Same shape as ScheduleRow (date block · body · trailing icon) so a
 * personal event reads as part of the same agenda list, not a different
 * kind of thing bolted on — brown accent instead of a status color, and a
 * trash icon instead of a chevron since there's nothing to navigate into.
 */
export function PersonalEventRow({
  event,
  locale,
  onDelete,
}: {
  event: PersonalEvent;
  locale: string;
  onDelete: () => void;
}) {
  const start = new Date(`${event.start_date}T00:00:00Z`);
  const startLabel = start.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const meta =
    !event.end_date || event.end_date === event.start_date
      ? startLabel
      : `${startLabel} – ${new Date(`${event.end_date}T00:00:00Z`).toLocaleDateString(locale, {
          day: 'numeric',
          month: 'short',
          timeZone: 'UTC',
        })}`;

  return (
    <View style={styles.row}>
      <View style={styles.date}>
        <Text style={styles.day}>{start.getUTCDate()}</Text>
        <Text style={styles.month}>
          {start.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' }).replace('.', '')}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={12} style={({ pressed }) => pressed && { opacity: 0.6 }}>
        <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.customEvent,
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
    color: colors.customEvent,
    textTransform: 'uppercase',
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
