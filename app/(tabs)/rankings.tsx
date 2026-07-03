import { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { FestivalCard } from '@/components/festival/FestivalCard';
import { useFestivals } from '@/features/festivals/api';
import { colors, spacing, typography } from '@/theme';

/**
 * Community ranking ordered by Bayesian score (see festival_community_stats
 * view) so festivals with 2 five-star votes don't outrank well-established
 * ones. Festivals without any rating yet are excluded.
 */
export default function Rankings() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useFestivals();

  const ranked = useMemo(
    () =>
      (data ?? [])
        .filter((item) => (item.stats?.rating_count ?? 0) > 0)
        .sort((a, b) => (b.stats?.bayesian_score ?? 0) - (a.stats?.bayesian_score ?? 0)),
    [data],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>{t('rankings.title')}</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={ranked}
          keyExtractor={(item) => item.festival.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.position}>{index + 1}</Text>
              <View style={styles.cardWrap}>
                <FestivalCard festival={item.festival} stats={item.stats} />
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t('empty.noReviews')}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  loader: { marginTop: spacing.xxxl },
  list: { gap: spacing.md, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  position: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.primary,
    width: 28,
    textAlign: 'center',
  },
  cardWrap: { flex: 1 },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xxl,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
