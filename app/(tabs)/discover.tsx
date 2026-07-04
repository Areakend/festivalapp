import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/Chip';
import { FilterSheet } from '@/components/ui/FilterSheet';
import { FestivalCard } from '@/components/festival/FestivalCard';
import { useFestivals } from '@/features/festivals/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';

type SortKey = 'popular' | 'rating' | 'name' | 'rank';
type SheetKey = 'genre' | 'country' | 'sort' | null;

export default function Discover() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isRefetching, refetch } = useFestivals();

  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [top100Only, setTop100Only] = useState(false);
  const [sort, setSort] = useState<SortKey>('popular');
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);

  const SORT_LABELS: Record<SortKey, string> = {
    popular: t('discover.sortPopular'),
    rating: t('review.sortHighest'),
    name: t('discover.sortName'),
    rank: t('discover.sortRank'),
  };

  // Filter options derived from the catalog itself — no hardcoded lists.
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
    const result = data.filter(({ festival }) => {
      if (q && !festival.name.toLowerCase().includes(q)) return false;
      if (genre && !festival.genres.includes(genre)) return false;
      if (country && festival.country !== country) return false;
      if (top100Only && festival.best_djmag_rank == null) return false;
      return true;
    });
    return result.sort((a, b) => {
      switch (sort) {
        case 'popular':
          return (b.stats?.rating_count ?? 0) - (a.stats?.rating_count ?? 0);
        case 'rating':
          return (b.stats?.bayesian_score ?? 0) - (a.stats?.bayesian_score ?? 0);
        case 'name':
          return a.festival.name.localeCompare(b.festival.name);
        case 'rank':
          return (a.festival.best_djmag_rank ?? 999) - (b.festival.best_djmag_rank ?? 999);
      }
    });
  }, [data, search, genre, country, top100Only, sort]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>{t('tabs.discover')}</Text>

      <TextInput
        style={styles.search}
        placeholder={t('common.search')}
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      {/* One chip per filter category — each opens a clean picker sheet */}
      <View style={styles.filterRow}>
        <Chip
          label={t('tabs.djmag')}
          active={top100Only}
          activeColor={colors.rating}
          onPress={() => setTop100Only((v) => !v)}
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
          label={SORT_LABELS[sort]}
          active={sort !== 'popular'}
          activeColor={colors.accent}
          onPress={() => setOpenSheet('sort')}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.festival.id}
          renderItem={({ item }) => <FestivalCard festival={item.festival} stats={item.stats} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
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
        visible={openSheet === 'sort'}
        title={t('discover.sort')}
        options={(Object.keys(SORT_LABELS) as SortKey[]).map((key) => ({
          value: key,
          label: SORT_LABELS[key],
        }))}
        selected={sort}
        onSelect={(v) => setSort((v as SortKey) ?? 'popular')}
        onClose={() => setOpenSheet(null)}
      />
    </View>
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
  list: { gap: spacing.md, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xxxl },
  empty: { alignItems: 'center', marginTop: spacing.xxxl },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
