import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/Chip';
import { FestivalCard } from '@/components/festival/FestivalCard';
import { useFestivals } from '@/features/festivals/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';

export default function Discover() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useFestivals();

  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [top100Only, setTop100Only] = useState(false);

  // Filter options derived from the catalog itself — no hardcoded lists.
  const { genres, countries } = useMemo(() => {
    const genreSet = new Set<string>();
    const countrySet = new Set<string>();
    data?.forEach(({ festival }) => {
      festival.genres.forEach((g) => genreSet.add(g));
      countrySet.add(festival.country);
    });
    return { genres: [...genreSet].sort(), countries: [...countrySet].sort() };
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter(({ festival }) => {
      if (q && !festival.name.toLowerCase().includes(q)) return false;
      if (genre && !festival.genres.includes(genre)) return false;
      if (country && festival.country !== country) return false;
      if (top100Only && festival.best_djmag_rank == null) return false;
      return true;
    });
  }, [data, search, genre, country, top100Only]);

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
      >
        <Chip
          label={t('tabs.djmag')}
          active={top100Only}
          activeColor={colors.rating}
          onPress={() => setTop100Only((v) => !v)}
        />
        {genres.map((g) => (
          <Chip
            key={g}
            label={g}
            active={genre === g}
            onPress={() => setGenre((v) => (v === g ? null : g))}
          />
        ))}
        {countries.map((c) => (
          <Chip
            key={c}
            label={`${countryFlag(c)} ${c}`}
            active={country === c}
            onPress={() => setCountry((v) => (v === c ? null : c))}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : isError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('common.error')}</Text>
          <Text style={styles.retry} onPress={() => refetch()}>
            {t('common.retry')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.festival.id}
          renderItem={({ item }) => <FestivalCard festival={item.festival} stats={item.stats} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('empty.noResults')}</Text>
            </View>
          }
        />
      )}
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
  filters: { flexGrow: 0, marginBottom: spacing.md },
  filtersContent: { gap: spacing.sm, paddingRight: spacing.xl },
  list: { gap: spacing.md, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xxxl },
  empty: { alignItems: 'center', marginTop: spacing.xxxl, gap: spacing.md },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  retry: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.primary,
  },
});
