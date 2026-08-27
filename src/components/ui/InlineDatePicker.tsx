import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { buildMonthGrid, ymd } from '@/utils/calendarGrid';
import { colors, radii, spacing, typography } from '@/theme';

const REFERENCE_MONDAY = Date.UTC(2024, 0, 1); // 2024-01-01 was a Monday

/**
 * Custom month-grid date picker, same visual language as the planning
 * calendar, used instead of the native OS picker in bottom sheets. The
 * native Android dialog re-shows itself whenever the controlled `value`
 * it's bound to changes while still mounted — a sheet that keeps the
 * field mounted after a pick (rather than dismissing on first select,
 * which a range picker with two fields can't do) reads as an infinite
 * reopen loop. Being a plain view instead of an imperative OS dialog
 * sidesteps that entirely, and matches the app's own theme everywhere
 * instead of the device's system picker style.
 */
export function InlineDatePicker({
  value,
  onChange,
  locale,
}: {
  value: Date;
  onChange: (date: Date) => void;
  locale: string;
}) {
  const [month, setMonth] = useState(
    () => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1)),
  );

  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const selectedYmd = ymd(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  const todayYmd = new Date().toISOString().slice(0, 10);
  const monthLabel = month.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(REFERENCE_MONDAY + i * 86_400_000)
          .toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })
          .replace('.', ''),
      ),
    [locale],
  );

  const changeMonth = (delta: number) => {
    setMonth((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + delta, 1)));
  };

  const selectDay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number];
    onChange(new Date(Date.UTC(y, m - 1, d)));
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthHeader}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={10}>
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={() => changeMonth(1)} hitSlop={10}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {weekdayLabels.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {grid.map((cell) => {
          const isSelected = cell.date === selectedYmd;
          const isToday = cell.date === todayYmd;
          return (
            <Pressable key={cell.date} style={styles.cell} onPress={() => selectDay(cell.date)}>
              <View
                style={[
                  styles.cellInner,
                  isSelected && styles.cellSelected,
                  isToday && !isSelected && styles.cellToday,
                ]}
              >
                <Text
                  style={[
                    styles.cellDay,
                    !cell.inMonth && styles.cellDayOutMonth,
                    isSelected && styles.cellDaySelected,
                  ]}
                >
                  {Number(cell.date.slice(8, 10))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  monthLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.text,
    textTransform: 'capitalize',
    minWidth: 140,
    textAlign: 'center',
  },
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellInner: {
    width: '78%',
    height: '78%',
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellToday: { borderWidth: 1, borderColor: colors.primary },
  cellSelected: { backgroundColor: colors.primary },
  cellDay: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  cellDayOutMonth: { color: colors.textMuted },
  cellDaySelected: { color: colors.textOnPrimary, fontFamily: typography.fonts.bodySemiBold },
});
