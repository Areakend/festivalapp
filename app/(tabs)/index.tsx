import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { useFestivals, useMyStatuses, type CatalogItem } from '@/features/festivals/api';
import { useFriendsFestivalAttendance, type PublicProfile } from '@/features/friends/api';
import { colors, radii, spacing, typography } from '@/theme';

const DAY_MS = 24 * 60 * 60 * 1000;
const UP_NEXT_COUNT = 3;

interface AgendaEntry {
  item: CatalogItem;
  daysUntil: number | null; // null = planned but no confirmed date
  happeningNow: boolean;
}

/**
 * Home, countdown-first: one hero (days until the next festival, who of my
 * friends is going), a short "up next" list, and two quiet pills linking to
 * wishlist/favorites. Everything else lives on the Festivals tab and the
 * profile — this screen is deliberately sparse.
 */
export default function Home() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: catalog, isRefetching } = useFestivals();
  const { data: myStatuses } = useMyStatuses();
  const { data: friendsAttendance } = useFriendsFestivalAttendance();

  const { hero, upNext, hasMorePlanned, wishlistCount, favoriteCount, friendsByFestival } =
    useMemo(() => {
      const byId = new Map((catalog ?? []).map((item) => [item.festival.id, item]));
      const idsWith = (status: string) =>
        (myStatuses ?? []).filter((s) => s.status === status).map((s) => s.festival_id);

      const friendsByFestival = new Map<string, PublicProfile[]>();
      for (const row of friendsAttendance ?? []) {
        const arr = friendsByFestival.get(row.festival_id) ?? [];
        if (!arr.some((p) => p.id === row.profile.id)) arr.push(row.profile);
        friendsByFestival.set(row.festival_id, arr);
      }

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

      const hero = agenda.find((e) => e.daysUntil != null) ?? null;
      const rest = agenda.filter((e) => e !== hero);

      return {
        hero,
        upNext: rest.slice(0, UP_NEXT_COUNT),
        hasMorePlanned: rest.length > UP_NEXT_COUNT,
        wishlistCount: idsWith('wishlist').length,
        favoriteCount: idsWith('favorite').length,
        friendsByFestival,
      };
    }, [catalog, myStatuses, friendsAttendance]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['festivals'] });
    void queryClient.invalidateQueries({ queryKey: ['my-statuses'] });
    void queryClient.invalidateQueries({ queryKey: ['friends-festival-attendance'] });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  const openFestival = (item: CatalogItem) =>
    router.push({ pathname: '/festival/[slug]', params: { slug: item.festival.slug } });

  const friendNames = (festivalId: string) => {
    const friends = friendsByFestival.get(festivalId) ?? [];
    if (friends.length === 0) return null;
    const names = friends.slice(0, 3).map((p) => p.display_name);
    return friends.length > 3 ? `${names.join(', ')} +${friends.length - 3}` : names.join(', ');
  };

  const heroFriends = hero ? friendNames(hero.item.festival.id) : null;
  const hasAnything = upNext.length > 0 || wishlistCount > 0 || favoriteCount > 0;

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
      {hero && hero.item.nextEdition ? (
        <Pressable
          style={({ pressed }) => [styles.hero, pressed && { opacity: 0.85 }]}
          onPress={() => openFestival(hero.item)}
        >
          <Text style={styles.heroLabel}>{t('home.nextFestival')}</Text>
          {hero.happeningNow ? (
            <Text style={styles.heroNow}>{t('home.happeningNow')}</Text>
          ) : (
            <>
              <Text style={styles.heroCount}>{hero.daysUntil}</Text>
              <Text style={styles.heroDaysWord}>{t('home.days', { count: hero.daysUntil ?? 0 })}</Text>
            </>
          )}
          <Text style={styles.heroName} numberOfLines={1}>
            {hero.item.festival.name}
          </Text>
          <Text style={styles.heroMeta}>
            {formatDate(hero.item.nextEdition.start_date)}
            {hero.item.nextEdition.end_date
              ? ` – ${formatDate(hero.item.nextEdition.end_date)}`
              : ''}
            {hero.item.festival.city ? ` · ${hero.item.festival.city}` : ''}
          </Text>
          {heroFriends && (
            <View style={styles.heroFriends}>
              <Ionicons name="people" size={14} color={colors.textSecondary} />
              <Text style={styles.heroFriendsText}>
                {t('home.withFriends', { names: heroFriends })}
              </Text>
            </View>
          )}
        </Pressable>
      ) : (
        <View style={styles.welcomeCard}>
          <Ionicons name="sparkles" size={26} color={colors.primary} />
          <Text style={styles.welcomeTitle}>
            {t(hasAnything ? 'home.noPlannedTitle' : 'home.welcomeTitle')}
          </Text>
          <Text style={styles.welcomeBody}>
            {t(hasAnything ? 'home.noPlannedHint' : 'home.welcomeBody')}
          </Text>
          <Button label={t('tabs.festivals')} onPress={() => router.push('/discover')} />
        </View>
      )}

      {/* Up next — the two or three after the hero, one quiet line each */}
      {upNext.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('home.upNext')}</Text>
          {upNext.map(({ item }) => {
            const friends = friendsByFestival.get(item.festival.id) ?? [];
            return (
              <Pressable
                key={item.festival.id}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                onPress={() => openFestival(item)}
              >
                <Text style={styles.rowDate}>
                  {item.nextEdition
                    ? formatDate(item.nextEdition.start_date)
                    : t('home.dateTbc')}
                </Text>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item.festival.name}
                </Text>
                {friends.length > 0 && (
                  <View style={styles.rowFriends}>
                    <Ionicons name="people" size={12} color={colors.textMuted} />
                    <Text style={styles.rowFriendsCount}>{friends.length}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          {hasMorePlanned && (
            <Pressable onPress={() => router.push('/list/planned')} hitSlop={8}>
              <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Wishlist & favorites, one tap away instead of two long sections */}
      {(wishlistCount > 0 || favoriteCount > 0) && (
        <View style={styles.pillRow}>
          {wishlistCount > 0 && (
            <Pill
              icon="heart"
              label={`${t('festival.wishlist')} · ${wishlistCount}`}
              onPress={() => router.push('/list/wishlist')}
            />
          )}
          {favoriteCount > 0 && (
            <Pill
              icon="star"
              label={`${t('festival.favorite')} · ${favoriteCount}`}
              onPress={() => router.push('/list/favorite')}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
}

function Pill({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pill, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <Ionicons name={icon as never} size={14} color={colors.textSecondary} />
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
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
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  friendsButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    padding: spacing.md,
  },
  hero: {
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
    // faint violet halo so the countdown reads as one object, not loose text
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.30)',
    borderRadius: radii.lg,
  },
  heroLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  heroCount: {
    fontFamily: typography.fonts.heading,
    fontSize: 72,
    lineHeight: 78,
    color: colors.text,
  },
  heroDaysWord: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  heroNow: {
    fontFamily: typography.fonts.heading,
    fontSize: 34,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  heroName: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.primary,
    marginTop: spacing.md,
  },
  heroMeta: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  heroFriends: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  heroFriendsText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  sectionLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDate: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    width: 64,
  },
  rowName: {
    flex: 1,
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  rowFriends: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rowFriendsCount: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  seeAll: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.primary,
    paddingVertical: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
  },
  pillText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  welcomeCard: {
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.30)',
    borderRadius: radii.lg,
  },
  welcomeTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
    textAlign: 'center',
  },
  welcomeBody: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
