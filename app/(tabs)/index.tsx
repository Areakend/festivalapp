import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { ScheduleRow } from '@/components/festival/ScheduleRow';
import { useFestivals, useMyStatuses, type CatalogItem } from '@/features/festivals/api';
import { useDjMagTop100 } from '@/features/profile/api';
import { colors, radii, spacing, typography } from '@/theme';

const DAY_MS = 24 * 60 * 60 * 1000;

interface AgendaEntry {
  item: CatalogItem;
  daysUntil: number | null; // null = planned but no confirmed date
  happeningNow: boolean;
}

/**
 * Home: countdown to the next planned festival, chronological agenda of
 * everything planned, quick stats, wishlist & favorites shelves.
 */
export default function Home() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: catalog, isRefetching } = useFestivals();
  const { data: myStatuses } = useMyStatuses();
  const { data: djmag } = useDjMagTop100();

  const { agenda, next, wishlist, favorites, attendedCount, wishlistCount, djmagCount } =
    useMemo(() => {
      const byId = new Map((catalog ?? []).map((item) => [item.festival.id, item]));
      const idsWith = (status: string) =>
        (myStatuses ?? []).filter((s) => s.status === status).map((s) => s.festival_id);

      const now = Date.now();
      const agenda: AgendaEntry[] = idsWith('planned')
        .map((id) => byId.get(id))
        .filter((item): item is CatalogItem => item != null)
        .map((item) => {
          if (!item.nextEdition) return { item, daysUntil: null, happeningNow: false };
          const start = new Date(item.nextEdition.start_date).getTime();
          const end = item.nextEdition.end_date
            ? new Date(item.nextEdition.end_date).getTime() + DAY_MS
            : start + DAY_MS;
          return {
            item,
            daysUntil: Math.max(0, Math.ceil((start - now) / DAY_MS)),
            happeningNow: now >= start && now < end,
          };
        })
        .sort((a, b) => {
          // dated first (soonest on top), undated at the end
          if (a.daysUntil == null) return b.daysUntil == null ? 0 : 1;
          if (b.daysUntil == null) return -1;
          return a.daysUntil - b.daysUntil;
        });

      const next = agenda.find((e) => e.daysUntil != null) ?? null;

      const attendedIds = new Set(idsWith('attended'));
      return {
        agenda,
        next,
        wishlist: idsWith('wishlist')
          .map((id) => byId.get(id))
          .filter((item): item is CatalogItem => item != null),
        favorites: idsWith('favorite')
          .map((id) => byId.get(id))
          .filter((item): item is CatalogItem => item != null),
        attendedCount: attendedIds.size,
        wishlistCount: idsWith('wishlist').length,
        djmagCount: (djmag?.entries ?? []).filter((e) => attendedIds.has(e.festivals.id)).length,
      };
    }, [catalog, myStatuses, djmag]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['festivals'] });
    void queryClient.invalidateQueries({ queryKey: ['my-statuses'] });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  const openFestival = (item: CatalogItem) =>
    router.push({ pathname: '/festival/[slug]', params: { slug: item.festival.slug } });

  const hasAnything = agenda.length > 0 || wishlist.length > 0 || favorites.length > 0;

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('common.appName')}</Text>
        <Pressable style={styles.friendsButton} onPress={() => router.push('/friends')} hitSlop={8}>
          <Ionicons name="people" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Countdown hero — the single thing you open the app for */}
      {next && next.item.nextEdition && (
        <Pressable
          style={({ pressed }) => [styles.heroWrap, pressed && { opacity: 0.9 }]}
          onPress={() => openFestival(next.item)}
        >
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>{t('home.nextFestival')}</Text>
            <Text style={styles.heroCountdown}>
              {next.happeningNow
                ? t('home.happeningNow')
                : t('home.inDays', { count: next.daysUntil ?? 0 })}
            </Text>
            <Text style={styles.heroName} numberOfLines={1}>
              {next.item.festival.name}
            </Text>
            <Text style={styles.heroDate}>
              {formatDate(next.item.nextEdition.start_date)}
              {next.item.nextEdition.end_date
                ? ` – ${formatDate(next.item.nextEdition.end_date)}`
                : ''}
              {next.item.festival.city ? ` · ${next.item.festival.city}` : ''}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <QuickStat value={String(attendedCount)} label={t('festival.attended')} color={colors.statusAttended} />
        <QuickStat value={String(wishlistCount)} label={t('festival.wishlist')} color={colors.statusWishlist} />
        <QuickStat value={`${djmagCount}/100`} label="DJ Mag" color={colors.rating} />
      </View>

      {/* Chronological agenda of planned festivals */}
      {agenda.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={18} color={colors.statusPlanned} />
            <Text style={[styles.sectionTitle, { color: colors.statusPlanned }]}>
              {t('home.planning')}
            </Text>
            <Text style={styles.sectionCount}>{agenda.length}</Text>
          </View>
          <View style={styles.agendaList}>
            {agenda.map(({ item, daysUntil, happeningNow }) => (
              <ScheduleRow
                key={item.festival.id}
                item={item}
                meta={
                  happeningNow
                    ? t('home.happeningNow')
                    : daysUntil != null
                      ? t('home.inDays', { count: daysUntil })
                      : t('home.dateTbc')
                }
                locale={i18n.language}
                onPress={() => openFestival(item)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Wishlist & favorites, same row format as the schedule above */}
      {[
        { key: 'wishlist', items: wishlist, labelKey: 'festival.wishlist', icon: 'heart', color: colors.statusWishlist },
        { key: 'favorite', items: favorites, labelKey: 'festival.favorite', icon: 'star', color: colors.statusFavorite },
      ]
        .filter((s) => s.items.length > 0)
        .map((section) => (
          <View key={section.key} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon as never} size={18} color={section.color} />
              <Text style={[styles.sectionTitle, { color: section.color }]}>
                {t(section.labelKey)}
              </Text>
              <Text style={styles.sectionCount}>{section.items.length}</Text>
            </View>
            <View style={styles.agendaList}>
              {section.items.map((item) => (
                <ScheduleRow
                  key={item.festival.id}
                  item={item}
                  meta={
                    item.nextEdition
                      ? `${formatDate(item.nextEdition.start_date)}${
                          item.nextEdition.end_date ? ` – ${formatDate(item.nextEdition.end_date)}` : ''
                        }`
                      : t('home.dateTbc')
                  }
                  locale={i18n.language}
                  onPress={() => openFestival(item)}
                />
              ))}
            </View>
          </View>
        ))}

      {!hasAnything && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('empty.noFestivals')}</Text>
          <Button label={t('tabs.festivals')} onPress={() => router.push('/discover')} />
        </View>
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
  heroWrap: { paddingHorizontal: spacing.xl },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  heroLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
  },
  heroCountdown: {
    fontFamily: typography.fonts.heading,
    fontSize: 40,
    color: colors.textOnPrimary,
  },
  heroName: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.textOnPrimary,
  },
  heroDate: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
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
  agendaList: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  empty: { alignItems: 'center', marginTop: spacing.xxxl, gap: spacing.xl },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
