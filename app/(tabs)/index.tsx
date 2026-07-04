import { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { FestivalPosterCard } from '@/components/festival/FestivalPosterCard';
import { useFestivals, useMyStatuses } from '@/features/festivals/api';
import { useDjMagTop100 } from '@/features/profile/api';
import { colors, radii, spacing, typography } from '@/theme';
import type { FestivalStatus } from '@/types/domain';

const SECTIONS: { status: FestivalStatus; labelKey: string; icon: string; color: string }[] = [
  { status: 'attended', labelKey: 'festival.attended', icon: 'checkmark-circle', color: colors.statusAttended },
  { status: 'planned', labelKey: 'festival.planned', icon: 'calendar', color: colors.statusPlanned },
  { status: 'wishlist', labelKey: 'festival.wishlist', icon: 'heart', color: colors.statusWishlist },
  { status: 'favorite', labelKey: 'festival.favorite', icon: 'star', color: colors.statusFavorite },
];

/** Home: quick stats + one horizontal carousel per tracking status. */
export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: catalog, isRefetching } = useFestivals();
  const { data: myStatuses } = useMyStatuses();
  const { data: djmag } = useDjMagTop100();

  const { sections, attendedCount, wishlistCount, djmagCount } = useMemo(() => {
    const byId = new Map((catalog ?? []).map((item) => [item.festival.id, item]));
    const built = SECTIONS.map((section) => ({
      ...section,
      items: (myStatuses ?? [])
        .filter((s) => s.status === section.status)
        .map((s) => byId.get(s.festival_id))
        .filter((item): item is NonNullable<typeof item> => item != null),
    }));
    const attendedIds = new Set(
      (myStatuses ?? []).filter((s) => s.status === 'attended').map((s) => s.festival_id),
    );
    return {
      sections: built.filter((s) => s.items.length > 0),
      attendedCount: attendedIds.size,
      wishlistCount: (myStatuses ?? []).filter((s) => s.status === 'wishlist').length,
      djmagCount: (djmag?.entries ?? []).filter((e) => attendedIds.has(e.festivals.id)).length,
    };
  }, [catalog, myStatuses, djmag]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['festivals'] });
    void queryClient.invalidateQueries({ queryKey: ['my-statuses'] });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xxl },
      ]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      {/* Header: title + friends shortcut */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.myFestivals')}</Text>
        <Pressable style={styles.friendsButton} onPress={() => router.push('/friends')} hitSlop={8}>
          <Ionicons name="people" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Quick stats strip */}
      <View style={styles.statsRow}>
        <QuickStat value={String(attendedCount)} label={t('festival.attended')} color={colors.statusAttended} />
        <QuickStat value={String(wishlistCount)} label={t('festival.wishlist')} color={colors.statusWishlist} />
        <QuickStat value={`${djmagCount}/100`} label="DJ Mag" color={colors.rating} />
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('empty.noFestivals')}</Text>
          <Button label={t('tabs.discover')} onPress={() => router.push('/discover')} />
        </View>
      ) : (
        sections.map((section) => (
          <View key={section.status} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon as never} size={18} color={section.color} />
              <Text style={[styles.sectionTitle, { color: section.color }]}>
                {t(section.labelKey)}
              </Text>
              <Text style={styles.sectionCount}>{section.items.length}</Text>
            </View>
            <FlatList
              horizontal
              data={section.items}
              keyExtractor={(item) => item.festival.id}
              renderItem={({ item }) => (
                <FestivalPosterCard festival={item.festival} stats={item.stats} />
              )}
              contentContainerStyle={styles.carousel}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ))
      )}
    </ScrollView>
  );
}

function QuickStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
  },
  friendsButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    padding: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
  },
  statLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  section: { gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
  },
  sectionCount: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  carousel: { gap: spacing.md, paddingHorizontal: spacing.xl },
  empty: { alignItems: 'center', marginTop: spacing.xxxl, gap: spacing.xl },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
