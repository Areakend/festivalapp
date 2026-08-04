import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PlanningCalendar } from '@/components/festival/PlanningCalendar';
import { useFestivals, useMyStatuses, type CatalogItem } from '@/features/festivals/api';
import { colors, spacing, typography } from '@/theme';

/** Calendar-grid view of the "planned" list — the flat list's alternate view. */
export default function PlanningCalendarScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: catalog } = useFestivals();
  const { data: myStatuses } = useMyStatuses();

  const items = useMemo(() => {
    const byId = new Map((catalog ?? []).map((item) => [item.festival.id, item]));
    return (myStatuses ?? [])
      .filter((s) => s.status === 'planned')
      .map((s) => byId.get(s.festival_id))
      .filter((item): item is CatalogItem => item != null && item.nextEdition != null);
  }, [catalog, myStatuses]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('home.planning')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {items.length === 0 ? (
        <Text style={styles.empty}>{t('empty.noFestivals')}</Text>
      ) : (
        <PlanningCalendar
          items={items}
          locale={i18n.language}
          onSelectFestival={(item) =>
            router.push({ pathname: '/festival/[slug]', params: { slug: item.festival.slug } })
          }
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: {
    flex: 1,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: { width: 24 },
  empty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
});
