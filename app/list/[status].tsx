import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ScheduleRow } from '@/components/festival/ScheduleRow';
import { useFestivals, useMyStatuses, type CatalogItem } from '@/features/festivals/api';
import { colors, spacing, typography } from '@/theme';

const TITLE_KEYS: Record<string, string> = {
  planned: 'home.planning',
  wishlist: 'festival.wishlist',
  favorite: 'festival.favorite',
};

/**
 * One of my festival lists (planned / wishlist / favorites), full length.
 * The Home screen only surfaces counts and the next few — this is the
 * "see all" destination, in the shared schedule-row format.
 */
export default function MyListScreen() {
  const { status } = useLocalSearchParams<{ status: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: catalog } = useFestivals();
  const { data: myStatuses } = useMyStatuses();

  const items = useMemo(() => {
    const byId = new Map((catalog ?? []).map((item) => [item.festival.id, item]));
    return (myStatuses ?? [])
      .filter((s) => s.status === status)
      .map((s) => byId.get(s.festival_id))
      .filter((item): item is CatalogItem => item != null)
      .sort((a, b) => {
        const aDate = a.nextEdition?.start_date;
        const bDate = b.nextEdition?.start_date;
        if (!aDate) return !bDate ? a.festival.name.localeCompare(b.festival.name) : 1;
        if (!bDate) return -1;
        return aDate.localeCompare(bDate);
      });
  }, [catalog, myStatuses, status]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

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
        <Text style={styles.title}>{t(TITLE_KEYS[status ?? ''] ?? 'home.planning')}</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
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
            onPress={() =>
              router.push({ pathname: '/festival/[slug]', params: { slug: item.festival.slug } })
            }
          />
        ))}
        {items.length === 0 && <Text style={styles.empty}>{t('empty.noFestivals')}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  title: {
    flex: 1,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  count: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  list: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  empty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
