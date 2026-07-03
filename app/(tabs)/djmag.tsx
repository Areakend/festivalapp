import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Chip } from '@/components/ui/Chip';
import { useMyStatuses } from '@/features/festivals/api';
import { useMyReviews } from '@/features/reviews/api';
import { useDjMagTop100, type DjMagEntry } from '@/features/profile/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';

type Filter = 'all' | 'attended' | 'notAttended' | 'wishlist';

export default function DjMagScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useDjMagTop100();
  const { data: myStatuses } = useMyStatuses();
  const { data: myReviews } = useMyReviews();

  const [filter, setFilter] = useState<Filter>('all');
  const [country, setCountry] = useState<string | null>(null);

  const attendedIds = useMemo(
    () => new Set((myStatuses ?? []).filter((s) => s.status === 'attended').map((s) => s.festival_id)),
    [myStatuses],
  );
  const wishlistIds = useMemo(
    () => new Set((myStatuses ?? []).filter((s) => s.status === 'wishlist').map((s) => s.festival_id)),
    [myStatuses],
  );
  const myRatingByFestival = useMemo(
    () => new Map((myReviews ?? []).map((r) => [r.festival_id, r.overall_rating])),
    [myReviews],
  );

  const attendedCount = useMemo(
    () => (data?.entries ?? []).filter((e) => attendedIds.has(e.festivals.id)).length,
    [data, attendedIds],
  );

  const countries = useMemo(
    () => [...new Set((data?.entries ?? []).map((e) => e.festivals.country))].sort(),
    [data],
  );

  const filtered = useMemo(() => {
    return (data?.entries ?? []).filter((e) => {
      if (country && e.festivals.country !== country) return false;
      if (filter === 'attended') return attendedIds.has(e.festivals.id);
      if (filter === 'notAttended') return !attendedIds.has(e.festivals.id);
      if (filter === 'wishlist') return wishlistIds.has(e.festivals.id);
      return true;
    });
  }, [data, filter, country, attendedIds, wishlistIds]);

  if (isLoading || !data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>
        {t('djmag.title')} · {data.year}
      </Text>

      {/* Progress */}
      <View style={styles.progressCard}>
        <Text style={styles.progressText}>{t('djmag.progress', { count: attendedCount })}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${attendedCount}%` }]} />
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
      >
        <Chip
          label={t('djmag.attendedOnly')}
          active={filter === 'attended'}
          activeColor={colors.statusAttended}
          onPress={() => setFilter((f) => (f === 'attended' ? 'all' : 'attended'))}
        />
        <Chip
          label={t('djmag.notAttended')}
          active={filter === 'notAttended'}
          onPress={() => setFilter((f) => (f === 'notAttended' ? 'all' : 'notAttended'))}
        />
        <Chip
          label={t('festival.wishlist')}
          active={filter === 'wishlist'}
          activeColor={colors.statusWishlist}
          onPress={() => setFilter((f) => (f === 'wishlist' ? 'all' : 'wishlist'))}
        />
        {countries.map((c) => (
          <Chip
            key={c}
            label={countryFlag(c)}
            active={country === c}
            onPress={() => setCountry((v) => (v === c ? null : c))}
          />
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(e) => e.festivals.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Top100Row
            entry={item}
            attended={attendedIds.has(item.festivals.id)}
            myRating={myRatingByFestival.get(item.festivals.id)}
            onPress={() =>
              router.push({ pathname: '/festival/[slug]', params: { slug: item.festivals.slug } })
            }
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('empty.noResults')}</Text>}
      />
    </View>
  );
}

function Top100Row({
  entry,
  attended,
  myRating,
  onPress,
}: {
  entry: DjMagEntry;
  attended: boolean;
  myRating: number | undefined;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]} onPress={onPress}>
      <Text style={styles.rank}>#{entry.rank_position}</Text>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {countryFlag(entry.festivals.country)} {entry.festivals.name}
        </Text>
        {entry.festivals.best_djmag_rank != null &&
          entry.festivals.best_djmag_rank < entry.rank_position && (
            <Text style={styles.bestRank}>peak #{entry.festivals.best_djmag_rank}</Text>
          )}
      </View>
      {myRating != null && (
        <View style={styles.myRating}>
          <Ionicons name="star" size={12} color={colors.rating} />
          <Text style={styles.myRatingText}>{myRating.toFixed(1)}</Text>
        </View>
      )}
      <Ionicons
        name={attended ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={attended ? colors.statusAttended : colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl },
  loader: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  progressText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: colors.statusAttended,
  },
  filters: { flexGrow: 0, marginBottom: spacing.md },
  filtersContent: { gap: spacing.sm, paddingRight: spacing.xl },
  list: { gap: spacing.sm, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rank: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.primary,
    width: 44,
  },
  rowBody: { flex: 1, gap: 2 },
  rowName: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  bestRank: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.rating,
  },
  myRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  myRatingText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.xs,
    color: colors.rating,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xxl,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
