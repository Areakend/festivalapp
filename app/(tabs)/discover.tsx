import { useEffect, useMemo, useState } from 'react';
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
import { FestivalFiltersSheet, type PeriodKey } from '@/components/festival/FestivalFiltersSheet';
import {
  useFestivalIdsByArtistSearch,
  useFestivals,
  useMyStatuses,
  useToggleStatus,
  type CatalogItem,
} from '@/features/festivals/api';
import { useMyReviews } from '@/features/reviews/api';
import { useFollowedArtistsRanking } from '@/features/artists/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag, countryName } from '@/utils/format';

type SortKey = 'top100' | 'community' | 'myRating' | 'date' | 'name' | 'followedArtists';
type SheetKey = 'filters' | 'sort' | null;

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
  const toggleStatus = useToggleStatus();
  const { data: myReviews } = useMyReviews();
  const { data: followedRanking } = useFollowedArtistsRanking();

  const [search, setSearch] = useState('');
  // Debounced so typing doesn't fire a query per keystroke — only the
  // artist-name match needs the server; name/country match locally.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const { data: artistMatchIds } = useFestivalIdsByArtistSearch(debouncedSearch);
  const [genres, setGenres] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [top100Only, setTop100Only] = useState(false);
  const [attendedOnly, setAttendedOnly] = useState(false);
  const [toRateOnly, setToRateOnly] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const [sort, setSort] = useState<SortKey>('community');
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);

  const SORT_LABELS: Record<SortKey, string> = {
    top100: t('discover.sortTop100'),
    community: t('discover.sortCommunity'),
    myRating: t('discover.sortMyRating'),
    date: t('discover.sortDate'),
    name: t('discover.sortName'),
    followedArtists: t('discover.sortFollowedArtists'),
  };
  const sortOptions = Object.keys(SORT_LABELS) as SortKey[];
  const PERIOD_LABELS: Record<Exclude<PeriodKey, 'custom'>, string> = {
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
  // Attended (any year) but never reviewed at all — "à noter".
  const toRateIds = useMemo(
    () =>
      new Set(
        [...attendedIds].filter((festivalId) => !myRatingByFestival.has(festivalId)),
      ),
    [attendedIds, myRatingByFestival],
  );
  const followedMatchByFestival = useMemo(
    () => new Map((followedRanking ?? []).map((r) => [r.festivalId, r.matchedCount])),
    [followedRanking],
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
      // searchText carries the localized name so typing "France" finds
      // 🇫🇷 FR even though the chip itself just shows the flag + code.
      countryOptions: [...countries]
        .sort()
        .map((c) => ({
          value: c,
          label: `${countryFlag(c)} ${countryName(c, i18n.language)}`,
          searchText: c,
        })),
    };
  }, [data, i18n.language]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const periodStart = period === 'custom' && customRange ? customRange.from.getTime() : now;
    const periodEnd =
      period === '3m'
        ? now + 92 * DAY_MS
        : period === '6m'
          ? now + 183 * DAY_MS
          : period === 'custom' && customRange
            ? customRange.to.getTime()
            : Infinity;

    // When a query's active, a direct name match should always lead over a
    // festival that only turned up because of its country, genre, or an
    // artist on its lineup — otherwise "dec" surfacing Decibel Open Air and
    // Awakenings in whatever order the active sort happens to produce reads
    // as random. Filled in during the filter pass below, read back in the
    // sort as the primary key (ties within the same tier still fall back
    // to the active sort).
    const matchRank = new Map<string, number>();

    const result = data.filter((item) => {
      const { festival, nextEdition } = item;
      if (q) {
        // Matches the festival's own name, its country (code or localized
        // name — "FR" and "France" both work), one of its genres, or an
        // artist who's played there (any edition, via the debounced
        // server-side search).
        const nameMatch = festival.name.toLowerCase().includes(q);
        const countryMatch =
          festival.country.toLowerCase().includes(q) ||
          countryName(festival.country, i18n.language).toLowerCase().includes(q);
        const genreMatch = festival.genres.some((g) => g.toLowerCase().includes(q));
        const artistMatch = artistMatchIds?.has(festival.id) ?? false;
        if (!nameMatch && !countryMatch && !genreMatch && !artistMatch) return false;
        matchRank.set(
          festival.id,
          nameMatch ? 0 : countryMatch ? 1 : genreMatch ? 2 : 3,
        );
      }
      if (genres.length > 0 && !festival.genres.some((g) => genres.includes(g))) return false;
      if (countries.length > 0 && !countries.includes(festival.country)) return false;
      if (top100Only && item.djmagRank == null) return false;
      if (attendedOnly && !attendedIds.has(festival.id)) return false;
      if (toRateOnly && !toRateIds.has(festival.id)) return false;
      if (period !== 'all') {
        if (!nextEdition) return false;
        const start = new Date(nextEdition.start_date).getTime();
        if (start > periodEnd) return false;
        if (period === 'custom' && start < periodStart) return false;
      }
      return true;
    });

    const myRating = (item: CatalogItem) => myRatingByFestival.get(item.festival.id);
    return result.sort((a, b) => {
      if (q) {
        const rankDiff = (matchRank.get(a.festival.id) ?? 3) - (matchRank.get(b.festival.id) ?? 3);
        if (rankDiff !== 0) return rankDiff;
      }
      switch (sort) {
        case 'top100':
          return (a.djmagRank ?? 999) - (b.djmagRank ?? 999);
        case 'community':
          return (b.stats?.bayesian_score ?? 0) - (a.stats?.bayesian_score ?? 0);
        case 'myRating':
          return (myRating(b) ?? -1) - (myRating(a) ?? -1);
        case 'date': {
          const ad = a.nextEdition ? new Date(a.nextEdition.start_date).getTime() : Infinity;
          const bd = b.nextEdition ? new Date(b.nextEdition.start_date).getTime() : Infinity;
          return ad - bd;
        }
        case 'name':
          return a.festival.name.localeCompare(b.festival.name);
        case 'followedArtists':
          return (
            (followedMatchByFestival.get(b.festival.id) ?? 0) -
            (followedMatchByFestival.get(a.festival.id) ?? 0)
          );
      }
    });
  }, [
    data,
    search,
    artistMatchIds,
    i18n.language,
    genres,
    countries,
    top100Only,
    attendedOnly,
    toRateOnly,
    period,
    customRange,
    sort,
    attendedIds,
    toRateIds,
    myRatingByFestival,
    followedMatchByFestival,
  ]);

  // Which matched festivals only showed up because of their lineup, not
  // their own name/country/genre — worth a small "why" hint, since
  // "Awakenings" appearing for "dec" (an artist there, not the festival
  // itself) reads as a bug otherwise.
  const artistOnlyMatchNames = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = new Map<string, string>();
    if (!q || !artistMatchIds) return result;
    for (const item of data ?? []) {
      const { festival } = item;
      const artistName = artistMatchIds.get(festival.id);
      if (!artistName) continue;
      const nameMatch = festival.name.toLowerCase().includes(q);
      const countryMatch =
        festival.country.toLowerCase().includes(q) ||
        countryName(festival.country, i18n.language).toLowerCase().includes(q);
      const genreMatch = festival.genres.some((g) => g.toLowerCase().includes(q));
      if (!nameMatch && !countryMatch && !genreMatch) result.set(festival.id, artistName);
    }
    return result;
  }, [data, search, artistMatchIds, i18n.language]);

  const top100Attended = useMemo(
    () => (data ?? []).filter((i) => i.djmagRank != null && attendedIds.has(i.festival.id)).length,
    [data, attendedIds],
  );

  const formatDate = (iso: string | Date) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  const activeFilterCount = genres.length + countries.length + (period !== 'all' ? 1 : 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>{t('tabs.festivals')}</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            placeholder={t('discover.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <Pressable style={styles.searchClear} onPress={() => setSearch('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        {/* Sort isn't a filter — it doesn't shrink the list, just its
            order — so it gets its own control instead of sitting in the
            chip row where it used to look like one more filter. */}
        <Pressable
          style={[styles.sortButton, openSheet === 'sort' && styles.sortButtonActive]}
          onPress={() => setOpenSheet('sort')}
          accessibilityLabel={t('discover.sort')}
        >
          <Ionicons
            name="swap-vertical"
            size={18}
            color={openSheet === 'sort' ? colors.primary : colors.textSecondary}
          />
        </Pressable>
      </View>

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
          label={t('discover.toRate')}
          active={toRateOnly}
          activeColor={colors.rating}
          onPress={() => setToRateOnly((v) => !v)}
        />
        <Chip
          label={
            activeFilterCount === 0
              ? t('discover.filters')
              : `${t('discover.filters')} (${activeFilterCount})`
          }
          active={activeFilterCount > 0}
          onPress={() => setOpenSheet('filters')}
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
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xxl }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <FestivalRow
              item={item}
              artistMatchHint={artistOnlyMatchNames.get(item.festival.id)}
              attended={attendedIds.has(item.festival.id)}
              onToggleAttended={() =>
                toggleStatus.mutate({
                  festivalId: item.festival.id,
                  status: 'attended',
                  active: attendedIds.has(item.festival.id),
                })
              }
              myRating={myRatingByFestival.get(item.festival.id)}
              followedMatchCount={
                sort === 'followedArtists' ? followedMatchByFestival.get(item.festival.id) : undefined
              }
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
              <Pressable onPress={() => router.push('/request-festival')} hitSlop={8}>
                <Text style={styles.requestLink}>{t('requestFestival.entryPoint')}</Text>
              </Pressable>
            </View>
          }
        />
      )}

      <FestivalFiltersSheet
        visible={openSheet === 'filters'}
        locale={i18n.language}
        genreOptions={genreOptions}
        genres={genres}
        onChangeGenres={setGenres}
        countryOptions={countryOptions}
        countries={countries}
        onChangeCountries={setCountries}
        period={period}
        periodLabels={PERIOD_LABELS}
        customRange={customRange}
        onChangePeriod={setPeriod}
        onChangeCustomRange={(from, to) => setCustomRange({ from, to })}
        onClose={() => setOpenSheet(null)}
      />
      <FilterSheet
        visible={openSheet === 'sort'}
        title={t('discover.sort')}
        options={sortOptions.map((key) => ({
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
  artistMatchHint,
  attended,
  onToggleAttended,
  myRating,
  followedMatchCount,
  dateLabel,
  onPress,
}: {
  item: CatalogItem;
  artistMatchHint: string | undefined;
  attended: boolean;
  onToggleAttended: () => void;
  myRating: number | undefined;
  followedMatchCount: number | undefined;
  dateLabel: string | undefined;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { festival, stats } = item;
  const hasCommunity = stats != null && stats.rating_count > 0;
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]} onPress={onPress}>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {countryFlag(festival.country)} {festival.name}
        </Text>
        {/* Always rendered so every row has the same height, dated or not. */}
        <Text style={styles.rowDate} numberOfLines={1}>
          {dateLabel ?? ' '}
        </Text>
        {artistMatchHint && (
          <Text style={styles.artistMatchHint} numberOfLines={1}>
            {t('discover.artistMatchHint', { name: artistMatchHint })}
          </Text>
        )}
      </View>
      <View style={styles.ratingBlock}>
        <View style={styles.communityRating}>
          <Ionicons name="star" size={12} color={hasCommunity ? colors.rating : colors.textMuted} />
          <Text
            style={[styles.communityRatingText, !hasCommunity && { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {hasCommunity ? `${Number(stats.avg_rating).toFixed(1)}/20` : '–'}
            {/* Review count, visually de-emphasized — a lone enthusiastic
                rating should read differently from a consensus of thirty,
                but shouldn't compete with the score itself for attention. */}
            {hasCommunity && <Text style={styles.communityRatingCount}> ({stats.rating_count})</Text>}
          </Text>
        </View>
        <View style={styles.myRating}>
          {followedMatchCount != null ? (
            followedMatchCount > 0 && (
              <>
                <Ionicons name="heart" size={10} color={colors.primary} />
                <Text style={[styles.myRatingText, { color: colors.primary }]}>{followedMatchCount}</Text>
              </>
            )
          ) : (
            myRating != null && (
              <>
                <Ionicons name="person" size={10} color={colors.textMuted} />
                <Text style={styles.myRatingText}>{myRating.toFixed(0)}/20</Text>
              </>
            )
          )}
        </View>
      </View>
      <Pressable
        onPress={onToggleAttended}
        hitSlop={12}
        style={({ pressed }) => pressed && { opacity: 0.6 }}
      >
        <Ionicons
          name={attended ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={attended ? colors.statusAttended : colors.textMuted}
        />
      </Pressable>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchWrap: { flex: 1 },
  sortButton: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButtonActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}1A` },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingRight: spacing.xxl,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  searchClear: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
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
  list: { gap: spacing.sm },
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
    height: 64, // fixed: every row identical, rated/dated or not
  },
  rowBody: { flex: 1, gap: 2 },
  rowName: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  rowDate: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.statusPlanned,
    minHeight: 15,
  },
  artistMatchHint: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  ratingBlock: { alignItems: 'flex-end', gap: 2, width: 84 },
  communityRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  communityRatingText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.rating,
  },
  communityRatingCount: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  myRating: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 13 },
  myRatingText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  empty: { alignItems: 'center', marginTop: spacing.xxxl },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  requestLink: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.accent,
    marginTop: spacing.md,
  },
});
