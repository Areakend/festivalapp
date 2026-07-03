import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { FestivalCard } from '@/components/festival/FestivalCard';
import { useFestivals, useMyStatuses } from '@/features/festivals/api';
import { colors, spacing, typography } from '@/theme';
import type { FestivalStatus } from '@/types/domain';

const SECTIONS: { status: FestivalStatus; labelKey: string; color: string }[] = [
  { status: 'attended', labelKey: 'festival.attended', color: colors.statusAttended },
  { status: 'planned', labelKey: 'festival.planned', color: colors.statusPlanned },
  { status: 'wishlist', labelKey: 'festival.wishlist', color: colors.statusWishlist },
  { status: 'favorite', labelKey: 'festival.favorite', color: colors.statusFavorite },
];

/** Home = "my festivals" dashboard grouped by tracking status. */
export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: catalog } = useFestivals();
  const { data: myStatuses } = useMyStatuses();

  const sections = useMemo(() => {
    if (!catalog || !myStatuses) return [];
    const byId = new Map(catalog.map((item) => [item.festival.id, item]));
    return SECTIONS.map((section) => ({
      ...section,
      items: myStatuses
        .filter((s) => s.status === section.status)
        .map((s) => byId.get(s.festival_id))
        .filter((item): item is NonNullable<typeof item> => item != null),
    })).filter((section) => section.items.length > 0);
  }, [catalog, myStatuses]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xxl },
      ]}
    >
      <Text style={styles.title}>{t('profile.myFestivals')}</Text>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('empty.noFestivals')}</Text>
          <Button label={t('tabs.discover')} onPress={() => router.push('/discover')} />
        </View>
      ) : (
        sections.map((section) => (
          <View key={section.status} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: section.color }]}>
              {t(section.labelKey)} · {section.items.length}
            </Text>
            <View style={styles.cards}>
              {section.items.map(({ festival, stats }) => (
                <FestivalCard key={festival.id} festival={festival} stats={stats} />
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
  },
  section: { gap: spacing.md },
  sectionTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
  },
  cards: { gap: spacing.md },
  empty: { alignItems: 'center', marginTop: spacing.xxxl, gap: spacing.xl },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
