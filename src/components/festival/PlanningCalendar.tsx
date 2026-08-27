import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { ScheduleRow } from '@/components/festival/ScheduleRow';
import { PersonalEventRow } from '@/components/festival/PersonalEventRow';
import { eachDay } from '@/components/ui/CalendarDaysSheet';
import { buildMonthGrid, ymd } from '@/utils/calendarGrid';
import type { CatalogItem } from '@/features/festivals/api';
import type { PersonalEvent } from '@/types/domain';
import type { PublicProfile } from '@/features/friends/api';
import { colors, radii, spacing, typography } from '@/theme';

export interface FriendPlanningItem {
  item: CatalogItem;
  profile: PublicProfile;
  /** Precomputed by the caller (same status → color table as the user's
   *  own items) so this component doesn't need to know about
   *  planned/wishlist/favorite at all, just "a color". */
  color: string;
}

type PlanningEntry =
  | { kind: 'festival'; item: CatalogItem }
  | { kind: 'friend'; friendItem: FriendPlanningItem }
  | { kind: 'personal'; event: PersonalEvent };

function entryKey(entry: PlanningEntry): string {
  if (entry.kind === 'festival') return `f:${entry.item.festival.id}`;
  if (entry.kind === 'friend') return `fr:${entry.friendItem.profile.id}:${entry.friendItem.item.festival.id}`;
  return `p:${entry.event.id}`;
}

function entryStartDate(entry: PlanningEntry): string {
  if (entry.kind === 'festival') return entry.item.nextEdition!.start_date;
  if (entry.kind === 'friend') return entry.friendItem.item.nextEdition!.start_date;
  return entry.event.start_date;
}

const REFERENCE_MONDAY = Date.UTC(2024, 0, 1); // 2024-01-01 was a Monday

/**
 * Month-grid view of the user's planned festivals — one dot per day with a
 * dated edition, tap a day (or a month with nothing selected) to see the
 * matching festivals below in the same row format as the flat list.
 */
export function PlanningCalendar({
  items,
  statusColorByFestivalId,
  personalEvents,
  onDeletePersonalEvent,
  friendItems,
  locale,
  onSelectFestival,
}: {
  items: CatalogItem[];
  /** Festival id -> theme color for its status (planned/wishlist/favorite)
   *  — lets the grid dots and agenda rows read at a glance instead of
   *  looking identical regardless of which list a festival is coming from. */
  statusColorByFestivalId: Map<string, string>;
  /** Custom real-life entries (a wedding, a work trip) — shown alongside
   *  tracked festivals regardless of the status filter above, since the
   *  whole point is spotting a clash before buying tickets. */
  personalEvents: PersonalEvent[];
  onDeletePersonalEvent: (id: string) => void;
  /** Selected friends' planned/wishlist/favorite festivals — grid dots
   *  render as a hollow ring (filled = mine, ring = a friend's) and the
   *  agenda groups them under their own name instead of mixing rows in
   *  with the user's own list. */
  friendItems: FriendPlanningItem[];
  locale: string;
  onSelectFestival: (item: CatalogItem) => void;
}) {
  const { t } = useTranslation();

  const itemsByDate = useMemo(() => {
    const map = new Map<string, PlanningEntry[]>();
    for (const item of items) {
      if (!item.nextEdition) continue;
      const days = eachDay(item.nextEdition.start_date, item.nextEdition.end_date ?? item.nextEdition.start_date);
      for (const day of days) {
        const arr = map.get(day) ?? [];
        arr.push({ kind: 'festival', item });
        map.set(day, arr);
      }
    }
    for (const friendItem of friendItems) {
      const e = friendItem.item.nextEdition;
      if (!e) continue;
      const days = eachDay(e.start_date, e.end_date ?? e.start_date);
      for (const day of days) {
        const arr = map.get(day) ?? [];
        arr.push({ kind: 'friend', friendItem });
        map.set(day, arr);
      }
    }
    for (const event of personalEvents) {
      const days = eachDay(event.start_date, event.end_date ?? event.start_date);
      for (const day of days) {
        const arr = map.get(day) ?? [];
        arr.push({ kind: 'personal', event });
        map.set(day, arr);
      }
    }
    return map;
  }, [items, friendItems, personalEvents]);

  const [month, setMonth] = useState(() => {
    const dates = [
      ...items.map((i) => i.nextEdition?.start_date),
      ...friendItems.map((f) => f.item.nextEdition?.start_date),
      ...personalEvents.map((e) => e.start_date),
    ].filter((d): d is string => !!d).sort();
    const first = dates[0];
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
    const inMonth: PlanningEntry[] = [];
    for (const [date, arr] of itemsByDate) {
      if (!date.startsWith(monthKey)) continue;
      for (const entry of arr) {
        const key = entryKey(entry);
        if (seen.has(key)) continue;
        seen.add(key);
        inMonth.push(entry);
      }
    }
    return inMonth.sort((a, b) => entryStartDate(a).localeCompare(entryStartDate(b)));
  }, [selectedDate, itemsByDate, monthKey]);

  // "Toi" (personal events + own tracked festivals) stays one list; each
  // selected friend gets their own section below it instead of every row
  // being mixed together — the whole reason this wasn't just one more dot
  // color was to keep whose-is-whose obvious without reading each row.
  const { mine, friendGroups } = useMemo(() => {
    const mine: PlanningEntry[] = [];
    const byFriend = new Map<string, { profile: PublicProfile; entries: PlanningEntry[] }>();
    for (const entry of agendaItems) {
      if (entry.kind === 'friend') {
        const p = entry.friendItem.profile;
        const group = byFriend.get(p.id) ?? { profile: p, entries: [] };
        group.entries.push(entry);
        byFriend.set(p.id, group);
      } else {
        mine.push(entry);
      }
    }
    return {
      mine,
      friendGroups: [...byFriend.values()].sort((a, b) =>
        a.profile.display_name.localeCompare(b.profile.display_name),
      ),
    };
  }, [agendaItems]);

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

  const renderEntry = (entry: PlanningEntry) => {
    if (entry.kind === 'festival') {
      return (
        <ScheduleRow
          key={entryKey(entry)}
          item={entry.item}
          meta={formatMeta(entry.item)}
          locale={locale}
          accentColor={statusColorByFestivalId.get(entry.item.festival.id)}
          onPress={() => onSelectFestival(entry.item)}
        />
      );
    }
    if (entry.kind === 'friend') {
      return (
        <ScheduleRow
          key={entryKey(entry)}
          item={entry.friendItem.item}
          meta={formatMeta(entry.friendItem.item)}
          locale={locale}
          accentColor={entry.friendItem.color}
          onPress={() => onSelectFestival(entry.friendItem.item)}
        />
      );
    }
    return (
      <PersonalEventRow
        key={entryKey(entry)}
        event={entry.event}
        locale={locale}
        onDelete={() => onDeletePersonalEvent(entry.event.id)}
      />
    );
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
                    {dayItems.slice(0, 3).map((entry) => {
                      if (entry.kind === 'friend') {
                        // Hollow ring = a friend's, filled = mine — same
                        // status colors either way, just the fill vs
                        // outline reads "whose" at a glance.
                        return (
                          <View
                            key={entryKey(entry)}
                            style={[
                              styles.dotRing,
                              !isSelected && { borderColor: entry.friendItem.color },
                              isSelected && styles.dotRingSelected,
                            ]}
                          />
                        );
                      }
                      const color = entry.kind === 'festival'
                        ? statusColorByFestivalId.get(entry.item.festival.id) ?? colors.statusPlanned
                        : colors.customEvent;
                      return (
                        <View
                          key={entryKey(entry)}
                          style={[
                            styles.dot,
                            !isSelected && { backgroundColor: color },
                            isSelected && styles.dotSelected,
                          ]}
                        />
                      );
                    })}
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
        {friendGroups.length > 0 && mine.length > 0 && <Text style={styles.sectionLabel}>{t('calendar.you')}</Text>}
        {mine.map((entry) => renderEntry(entry))}
        {friendGroups.map(({ profile, entries }) => (
          <View key={profile.id} style={styles.friendSection}>
            <View style={styles.friendSectionHeader}>
              <View style={styles.friendAvatar}>
                <Text style={styles.friendAvatarLetter}>{profile.display_name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.sectionLabel}>{profile.display_name}</Text>
            </View>
            {entries.map((entry) => renderEntry(entry))}
          </View>
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
  dots: { flexDirection: 'row', gap: 3, height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotSelected: { backgroundColor: colors.textOnPrimary },
  dotRing: { width: 6, height: 6, borderRadius: 3, borderWidth: 1.5 },
  dotRingSelected: { borderColor: colors.textOnPrimary },
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
  sectionLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  friendSection: { gap: spacing.sm, marginTop: spacing.sm },
  friendSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  friendAvatar: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarLetter: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
    color: colors.primary,
  },
});
