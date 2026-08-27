import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Chip } from '@/components/ui/Chip';
import { AddPersonalEventSheet } from '@/components/ui/AddPersonalEventSheet';
import { MultiFilterSheet } from '@/components/ui/MultiFilterSheet';
import { PlanningCalendar, type FriendPlanningItem } from '@/components/festival/PlanningCalendar';
import { useFestivals, useMyStatuses, type CatalogItem } from '@/features/festivals/api';
import { useAddPersonalEvent, useDeletePersonalEvent, useMyPersonalEvents } from '@/features/calendar/api';
import { useFriendships, useFriendsPlanningStatuses } from '@/features/friends/api';
import type { FestivalStatus } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

type PlanningStatus = Extract<FestivalStatus, 'planned' | 'wishlist' | 'favorite'>;

// A festival counts once even if it matches several active filters — this
// order decides which one "wins" for dedup purposes: planned (already
// decided) beats favorite (locked in but not yet planned) beats wishlist
// (still just considering).
const STATUS_PRIORITY: Record<PlanningStatus, number> = { planned: 0, favorite: 1, wishlist: 2 };

const STATUS_COLOR: Record<PlanningStatus, string> = {
  planned: colors.statusPlanned,
  wishlist: colors.statusWishlist,
  favorite: colors.statusFavorite,
};

const FILTERS: { status: PlanningStatus; labelKey: string; color: string }[] = [
  { status: 'planned', labelKey: 'festival.planned', color: STATUS_COLOR.planned },
  { status: 'wishlist', labelKey: 'festival.wishlist', color: STATUS_COLOR.wishlist },
  { status: 'favorite', labelKey: 'festival.favorite', color: STATUS_COLOR.favorite },
];

/** Calendar-grid view of the planned/wishlist/favorite lists — the flat
 *  list's alternate view. */
export default function PlanningCalendarScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: catalog } = useFestivals();
  const { data: myStatuses } = useMyStatuses();
  const { data: personalEvents } = useMyPersonalEvents();
  const addPersonalEvent = useAddPersonalEvent();
  const deletePersonalEvent = useDeletePersonalEvent();
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Set<PlanningStatus>>(new Set(['planned']));

  const { data: friendships } = useFriendships();
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [friendsSheetOpen, setFriendsSheetOpen] = useState(false);
  const { data: friendsStatuses } = useFriendsPlanningStatuses(selectedFriendIds);

  const toggleFilter = (status: PlanningStatus) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        // At least one filter must stay active, or the calendar has
        // nothing to show and no way to tell why.
        if (next.size === 1) return prev;
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const { items, statusColorByFestivalId } = useMemo(() => {
    const byId = new Map((catalog ?? []).map((item) => [item.festival.id, item]));
    const bestStatusByFestival = new Map<string, PlanningStatus>();
    for (const s of myStatuses ?? []) {
      if (!statusFilter.has(s.status as PlanningStatus)) continue;
      const status = s.status as PlanningStatus;
      const current = bestStatusByFestival.get(s.festival_id);
      if (!current || STATUS_PRIORITY[status] < STATUS_PRIORITY[current]) {
        bestStatusByFestival.set(s.festival_id, status);
      }
    }
    const items = [...bestStatusByFestival.keys()]
      .map((id) => byId.get(id))
      .filter((item): item is CatalogItem => item != null && item.nextEdition != null);
    const statusColorByFestivalId = new Map(
      [...bestStatusByFestival.entries()].map(([id, status]) => [id, STATUS_COLOR[status]]),
    );
    return { items, statusColorByFestivalId };
  }, [catalog, myStatuses, statusFilter]);

  // One entry per (friend, festival) they're tracking — same
  // planned-beats-favorite-beats-wishlist dedup as the user's own items,
  // just scoped per friend instead of pooled across all of them.
  const friendItems = useMemo<FriendPlanningItem[]>(() => {
    const byId = new Map((catalog ?? []).map((item) => [item.festival.id, item]));
    const profileById = new Map((friendships?.friends ?? []).map((f) => [f.profile.id, f.profile]));
    const bestByFriendFestival = new Map<string, PlanningStatus>();
    for (const s of friendsStatuses ?? []) {
      const key = `${s.profile_id}:${s.festival_id}`;
      const current = bestByFriendFestival.get(key);
      if (!current || STATUS_PRIORITY[s.status] < STATUS_PRIORITY[current]) {
        bestByFriendFestival.set(key, s.status);
      }
    }
    const result: FriendPlanningItem[] = [];
    for (const [key, status] of bestByFriendFestival) {
      const [friendId, festivalId] = key.split(':') as [string, string];
      const item = byId.get(festivalId);
      const profile = profileById.get(friendId);
      if (!item?.nextEdition || !profile) continue;
      result.push({ item, profile, color: STATUS_COLOR[status] });
    }
    return result;
  }, [catalog, friendsStatuses, friendships]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('home.planning')}</Text>
        <Pressable onPress={() => setAddEventOpen(true)} hitSlop={12} accessibilityLabel={t('calendar.addEvent')}>
          <Ionicons name="add-circle-outline" size={24} color={colors.customEvent} />
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(({ status, labelKey, color }) => (
          <Chip
            key={status}
            label={t(labelKey)}
            active={statusFilter.has(status)}
            activeColor={color}
            onPress={() => toggleFilter(status)}
          />
        ))}
        {(friendships?.friends.length ?? 0) > 0 && (
          <Chip
            label={
              selectedFriendIds.length === 0
                ? t('tabs.friends')
                : `${t('tabs.friends')} (${selectedFriendIds.length})`
            }
            active={selectedFriendIds.length > 0}
            onPress={() => setFriendsSheetOpen(true)}
          />
        )}
      </View>

      {items.length === 0 && (personalEvents?.length ?? 0) === 0 && friendItems.length === 0 ? (
        <Text style={styles.empty}>{t('empty.noFestivals')}</Text>
      ) : (
        <PlanningCalendar
          items={items}
          statusColorByFestivalId={statusColorByFestivalId}
          personalEvents={personalEvents ?? []}
          onDeletePersonalEvent={(id) => deletePersonalEvent.mutate(id)}
          friendItems={friendItems}
          locale={i18n.language}
          onSelectFestival={(item) =>
            router.push({ pathname: '/festival/[slug]', params: { slug: item.festival.slug } })
          }
        />
      )}

      <MultiFilterSheet
        visible={friendsSheetOpen}
        title={t('tabs.friends')}
        options={(friendships?.friends ?? []).map((f) => ({ value: f.profile.id, label: f.profile.display_name }))}
        selected={selectedFriendIds}
        onChange={setSelectedFriendIds}
        onClose={() => setFriendsSheetOpen(false)}
      />

      <AddPersonalEventSheet
        visible={addEventOpen}
        onSave={(input) => addPersonalEvent.mutate(input)}
        onClose={() => setAddEventOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: {
    flex: 1,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    textAlign: 'center',
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  empty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
});
