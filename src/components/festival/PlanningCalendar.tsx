import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { ScheduleRow } from '@/components/festival/ScheduleRow';
import { eachDay } from '@/components/ui/CalendarDaysSheet';
import type { CatalogItem } from '@/features/festivals/api';
import { colors, radii, spacing, typography } from '@/theme';

const REFERENCE_MONDAY = Date.UTC(2024, 0, 1); // 2024-01-01 was a Monday

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

interface DayCell {
  date: string;
  inMonth: boolean;
}

function buildMonthGrid(monthStart: Date): DayCell[] {
  const year = monthStart.getUTCFullYear();
  const month = monthStart.getUTCMonth();
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: DayCell[] = [];
  for (let i = firstWeekday; i > 0; i--) {
    const d = new Date(Date.UTC(year, month, 1 - i));
    cells.push({ date: ymd(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: ymd(year, month, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const [ly, lm, ld] = cells[cells.length - 1]!.date.split('-').map(Number) as [number, number, number];
    const d = new Date(Date.UTC(ly, lm - 1, ld + 1));
    cells.push({ date: ymd(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), inMonth: false });
  }
  return cells;
}

/**
 * Month-grid view of the user's planned festivals — one dot per day with a
 * dated edition, tap a day (or a month with nothing selected) to see the
 * matching festivals below in the same row format as the flat list.
 */
export function PlanningCalendar({
  items,
  locale,
  onSelectFestival,
}: {
  items: CatalogItem[];
  locale: string;
  onSelectFestival: (item: CatalogItem) => void;
}) {
  const { t } = useTranslation();

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const item of items) {
      if (!item.nextEdition) continue;
      const days = eachDay(item.nextEdition.start_date, item.nextEdition.end_date ?? item.nextEdition.start_date);
      for (const day of days) {
        const arr = map.get(day) ?? [];
        arr.push(item);
        map.set(day, arr);
      }
    }
    return map;
  }, [items]);

  const [month, setMonth] = useState(() => {
    const sorted = [...items].sort((a, b) =>
      a.nextEdition!.start_date.localeCompare(b.nextEdition!.start_date),
    );
    const first = sorted[0]?.nextEdition?.start_date;
    if (!first) return new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    const [y, m] = first.split('-').map(Number) as [number, number];
    return new Date(Date.UTC(y, m - 1, 1));
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const monthKey = ymd(month.getUTCFullYear(), month.getUTCMonth(), 1).slice(0, 7);
  const grid = useMemo(() => buildMonthGrid(month), [month]);

  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(REFERENCE_MONDAY + i * 86_400_000)
          .toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })
          .replace('.', ''),
      ),
    [locale],
  );

  const monthLabel = month.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const agendaItems = useMemo(() => {
    if (selectedDate) return itemsByDate.get(selectedDate) ?? [];
    const seen = new Set<string>();
    const inMonth: CatalogItem[] = [];
    for (const [date, arr] of itemsByDate) {
      if (!date.startsWith(monthKey)) continue;
      for (const item of arr) {
        if (seen.has(item.festival.id)) continue;
        seen.add(item.festival.id);
        inMonth.push(item);
      }
    }
    return inMonth.sort((a, b) => a.nextEdition!.start_date.localeCompare(b.nextEdition!.start_date));
  }, [selectedDate, itemsByDate, monthKey]);

  const changeMonth = (delta: number) => {
    setMonth((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + delta, 1)));
    setSelectedDate(null);
  };

  const formatMeta = (item: CatalogItem) => {
    const e = item.nextEdition!;
    const start = new Date(`${e.start_date}T00:00:00Z`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
    if (!e.end_date || e.end_date === e.start_date) return start;
    const end = new Date(`${e.end_date}T00:00:00Z`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
    return `${start} – ${end}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthHeader}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={() => changeMonth(1)} hitSlop={10}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
          const dayItems = itemsByDate.get(cell.date) ?? [];
          const isToday = cell.date === todayStr;
          const isSelected = cell.date === selectedDate;
          const dayNum = Number(cell.date.slice(8, 10));
          return (
            <Pressable
              key={cell.date}
              style={styles.cell}
              disabled={dayItems.length === 0}
              onPress={() => setSelectedDate((d) => (d === cell.date ? null : cell.date))}
            >
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
                  {dayNum}
                </Text>
                {dayItems.length > 0 && (
                  <View style={styles.dots}>
                    {dayItems.slice(0, 3).map((item) => (
                      <View
                        key={item.festival.id}
                        style={[styles.dot, isSelected && styles.dotSelected]}
                      />
                    ))}
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.agendaHint}>
        {selectedDate
          ? new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString(locale, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              timeZone: 'UTC',
            })
          : t('home.calendarHint')}
      </Text>

      <View style={styles.agenda}>
        {agendaItems.map((item) => (
          <ScheduleRow
            key={item.festival.id}
            item={item}
            meta={formatMeta(item)}
            locale={locale}
            onPress={() => onSelectFestival(item)}
          />
        ))}
        {agendaItems.length === 0 && <Text style={styles.agendaEmpty}>{t('empty.noFestivals')}</Text>}
      </View>
    </View>
  );
}

const CELL_SIZE = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  monthLabel: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
    textTransform: 'capitalize',
    minWidth: 160,
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
    width: '82%',
    height: '82%',
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  cellToday: { borderWidth: 1, borderColor: colors.statusPlanned },
  cellSelected: { backgroundColor: colors.statusPlanned },
  cellDay: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  cellDayOutMonth: { color: colors.textMuted },
  cellDaySelected: { color: colors.textOnPrimary, fontFamily: typography.fonts.bodySemiBold },
  dots: { flexDirection: 'row', gap: 2, height: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.statusPlanned },
  dotSelected: { backgroundColor: colors.textOnPrimary },
  agendaHint: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  agenda: { gap: spacing.sm },
  agendaEmpty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
