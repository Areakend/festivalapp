import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Chip } from '@/components/ui/Chip';
import { FilterSheet } from '@/components/ui/FilterSheet';
import { useFestivals, useMyStatuses, type CatalogItem } from '@/features/festivals/api';
import { useMyReviews } from '@/features/reviews/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';

type SortKey = 'top100' | 'community' | 'myRating' | 'popular' | 'date' | 'name';
type PeriodKey = 'all' | 'upcoming' | '3m' | '6m';
type SheetKey = 'genre' | 'country' | 'sort' | 'period' | null;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The single catalog screen: search + filters over the whole catalog,
 * DJ Mag Top 100 and community rankings included (they used to be three
 * separate, largely redundant tabs).
 */
export default function FestivalsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useFestivals();
  const { data: myStatuses } = useMyStatuses();
  const { data: myReviews } = useMyReviews();

  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [top100Only, setTop100Only] = useState(false);
  const [attendedOnly, setAttendedOnly] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [sort, setSort] = useState<SortKey>('community');
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);

  const SORT_LABELS: Record<SortKey, string> = {
    top100: t('discover.sortTop100'),
    community: t('discover.sortCommunity'),
    myRating: t('discover.sortMyRating'),
    popular: t('discover.sortPopular'),
    date: t('discover.sortDate'),
    name: t('discover.sortName'),
  };
  const PERIOD_LABELS: Record<PeriodKey, string> = {
    all: t('discover.periodAll'),
    upcoming: t('discover.periodUpcoming'),
    '3m': t('discover.period3m'),
    '6m': t('discover.period6m'),
  };

  const attendedIds = useMemo(
    () =>
      new Set(
        (myStatuses ?? []).filter((s) => s.status === 'attended').map((s) => s.festival_id),
      ),
    [myStatuses],
  );
  const myRatingByFestival = useMemo(
    () => new Map((myReviews ?? []).map((r) => [r.festival_id, Number(r.overall_rating)])),
    [myReviews],
  );

  const { genreOptions, countryOptions } = useMemo(() => {
    const genres = new Set<string>();
    const countries = new Set<string>();
    data?.forEach(({ festival }) => {
      festival.genres.forEach((g) => genres.add(g));
      countries.add(festival.country);
    });
    return {
      genreOptions: [...genres].sort().map((g) => ({ value: g, label: g })),
      countryOptions: [...countries]
        .sort()
        .map((c) => ({ value: c, label: `${countryFlag(c)}  ${c}` })),
    };
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const periodEnd =
      period === '3m' ? now + 92 * DAY_MS : period === '6m' ? now + 183 * DAY_MS : Infinity;

    const result = data.filter((item) => {
      const { festival, nextEdition } = item;
      if (q && !festival.name.toLowerCase().includes(q)) return false;
      if (genre && !festival.genres.includes(genre)) return false;
      if (country && festival.country !== country) return false;
      if (top100Only && item.djmagRank == null) return false;
      if (attendedOnly && !attendedIds.has(festival.id)) return false;
      if (period !== 'all') {
        if (!nextEdition) return false;
        if (new Date(nextEdition.start_date).getTime() > periodEnd) return false;
      }
      return true;
    });

    const myRating = (item: CatalogItem) => myRatingByFestival.get(item.festival.id);
    return result.sort((a, b) => {
      switch (sort) {
        case 'top100':
          return (a.djmagRank ?? 999) - (b.djmagRank ?? 999);
        case 'community':
          return (b.stats?.bayesian_score ?? 0) - (a.stats?.bayesian_score ?? 0);
        case 'myRating':
          return (myRating(b) ?? -1) - (myRating(a) ?? -1);
        case 'popular':
          return (b.stats?.rating_count ?? 0) - (a.stats?.rating_count ?? 0);
        case 'date': {
          const ad = a.nextEdition ? new Date(a.nextEdition.start_date).getTime() : Infinity;
          const bd = b.nextEdition ? new Date(b.nextEdition.start_date).getTime() : Infinity;
          return ad - bd;
        }
        case 'name':
          return a.festival.name.localeCompare(b.festival.name);
      }
    });
  }, [data, search, genre, country, top100Only, attendedOnly, period, sort, attendedIds, myRatingByFestival]);

  const top100Attended = useMemo(
    () => (data ?? []).filter((i) => i.djmagRank != null && attendedIds.has(i.festival.id)).length,
    [data, attendedIds],
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>{t('tabs.festivals')}</Text>

      <TextInput
        style={styles.search}
        placeholder={t('common.search')}
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      <View style={styles.filterRow}>
        <Chip
          label={t('tabs.djmag')}
          active={top100Only}
          activeColor={colors.rating}
          onPress={() => {
            setTop100Only((v) => {
              // entering Top 100 mode implies its natural ordering
              if (!v) setSort('top100');
              return !v;
            });
          }}
        />
        <Chip
          label={t('festival.attended')}
          active={attendedOnly}
          activeColor={colors.statusAttended}
          onPress={() => setAttendedOnly((v) => !v)}
        />
        <Chip
          label={genre ?? t('festival.genres')}
          active={genre != null}
          onPress={() => setOpenSheet('genre')}
        />
        <Chip
          label={country ? `${countryFlag(country)} ${country}` : t('djmag.filterCountry')}
          active={country != null}
          onPress={() => setOpenSheet('country')}
        />
        <Chip
          label={period === 'all' ? t('discover.period') : PERIOD_LABELS[period]}
          active={period !== 'all'}
          activeColor={colors.statusPlanned}
          onPress={() => setOpenSheet('period')}
        />
        <Chip
          label={SORT_LABELS[sort]}
          active
          activeColor={colors.accent}
          onPress={() => setOpenSheet('sort')}
        />
      </View>

      {/* Top 100 progress, only meaningful in Top 100 mode */}
      {top100Only && (
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>{t('djmag.progress', { count: top100Attended })}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${top100Attended}%` }]} />
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.festival.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item, index }) => (
            <FestivalRow
              item={item}
              position={
                sort === 'top100' || top100Only
                  ? item.djmagRank != null
                    ? `#${item.djmagRank}`
                    : '—'
                  : sort === 'community'
                    ? String(index + 1)
                    : undefined
              }
              attended={attendedIds.has(item.festival.id)}
              myRating={myRatingByFestival.get(item.festival.id)}
              dateLabel={
                item.nextEdition
                  ? `${formatDate(item.nextEdition.start_date)}${
                      item.nextEdition.end_date
                        ? ` – ${formatDate(item.nextEdition.end_date)}`
                        : ''
                    }`
                  : undefined
              }
              onPress={() =>
                router.push({ pathname: '/festival/[slug]', params: { slug: item.festival.slug } })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('empty.noResults')}</Text>
            </View>
          }
        />
      )}

      <FilterSheet
        visible={openSheet === 'genre'}
        title={t('festival.genres')}
        options={genreOptions}
        selected={genre}
        onSelect={setGenre}
        onClose={() => setOpenSheet(null)}
      />
      <FilterSheet
        visible={openSheet === 'country'}
        title={t('djmag.filterCountry')}
        options={countryOptions}
        selected={country}
        onSelect={setCountry}
        onClose={() => setOpenSheet(null)}
      />
      <FilterSheet
        visible={openSheet === 'period'}
        title={t('discover.period')}
        options={(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => ({
          value: key,
          label: PERIOD_LABELS[key],
        }))}
        selected={period}
        onSelect={(v) => setPeriod((v as PeriodKey) ?? 'all')}
        onClose={() => setOpenSheet(null)}
      />
      <FilterSheet
        visible={openSheet === 'sort'}
        title={t('discover.sort')}
        options={(Object.keys(SORT_LABELS) as SortKey[]).map((key) => ({
          value: key,
          label: SORT_LABELS[key],
        }))}
        selected={sort}
        onSelect={(v) => setSort((v as SortKey) ?? 'community')}
        onClose={() => setOpenSheet(null)}
      />
    </View>
  );
}

function FestivalRow({
  item,
  position,
  attended,
  myRating,
  dateLabel,
  onPress,
}: {
  item: CatalogItem;
  position: string | undefined;
  attended: boolean;
  myRating: number | undefined;
  dateLabel: string | undefined;
  onPress: () => void;
}) {
  const { festival, stats } = item;
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]} onPress={onPress}>
      {position != null && <Text style={styles.rank}>{position}</Text>}
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {countryFlag(festival.country)} {festival.name}
        </Text>
        <View style={styles.rowMetaLine}>
          {dateLabel != null && <Text style={styles.rowDate}>{dateLabel}</Text>}
          {stats != null && stats.rating_count > 0 && (
            <Text style={styles.rowCommunity}>
              ★ {Number(stats.avg_rating).toFixed(1)}/20 · {stats.rating_count}
            </Text>
          )}
        </View>
      </View>
      {myRating != null && (
        <View style={styles.myRating}>
          <Ionicons name="star" size={12} color={colors.rating} />
          <Text style={styles.myRatingText}>{myRating.toFixed(0)}/20</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  list: { gap: spacing.sm, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xxxl },
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
  rowMetaLine: { flexDirection: 'row', gap: spacing.md },
  rowDate: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.statusPlanned,
  },
  rowCommunity: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  myRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  myRatingText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.xs,
    color: colors.rating,
  },
  empty: { alignItems: 'center', marginTop: spacing.xxxl },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
