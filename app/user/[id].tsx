import { useMemo } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { FestivalPosterCard } from '@/components/festival/FestivalPosterCard';
import { ratingColor } from '@/components/ui/RatingBar';
import { useFestivals } from '@/features/festivals/api';
import { useFriendProfile } from '@/features/friends/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';
import type { FestivalStatus } from '@/types/domain';

const SECTIONS: { status: FestivalStatus; labelKey: string; color: string }[] = [
  { status: 'attended', labelKey: 'festival.attended', color: colors.statusAttended },
  { status: 'wishlist', labelKey: 'festival.wishlist', color: colors.statusWishlist },
  { status: 'planned', labelKey: 'festival.planned', color: colors.statusPlanned },
];

/** A friend's public profile: stats, tracked festivals, top ratings. */
export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data } = useFriendProfile(id);
  const { data: catalog } = useFestivals();

  const computed = useMemo(() => {
    if (!data || !catalog) return null;
    const byId = new Map(catalog.map((item) => [item.festival.id, item]));
    const sections = SECTIONS.map((section) => ({
      ...section,
      items: data.statuses
        .filter((s) => s.status === section.status)
        .map((s) => byId.get(s.festival_id))
        .filter((item): item is NonNullable<typeof item> => item != null),
    })).filter((s) => s.items.length > 0);
    const attended = data.statuses.filter((s) => s.status === 'attended');
    const countries = new Set(
      attended.map((s) => byId.get(s.festival_id)?.festival.country).filter(Boolean),
    );
    const topRated = [...data.reviews]
      .sort((a, b) => b.overall_rating - a.overall_rating)
      .slice(0, 5)
      .map((r) => ({
        rating: r.overall_rating,
        name: byId.get(r.festival_id)?.festival.name ?? '—',
      }));
    return { sections, attendedCount: attended.length, countryCount: countries.size, topRated };
  }, [data, catalog]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xxl },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {data?.profile.display_name ?? '…'}{' '}
          {data?.profile.country ? countryFlag(data.profile.country) : ''}
        </Text>
      </View>

      {computed && (
        <>
          <View style={styles.statsRow}>
            <Stat value={String(computed.attendedCount)} label={t('profile.festivalsAttended')} />
            <Stat value={String(computed.countryCount)} label={t('profile.countriesVisited')} />
            <Stat value={String(data!.reviews.length)} label={t('festival.reviews')} />
          </View>

          {computed.sections.map((section) => (
            <View key={section.status} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: section.color }]}>
                {t(section.labelKey)} · {section.items.length}
              </Text>
              <FlatList
                horizontal
                data={section.items}
                keyExtractor={(item) => item.festival.id}
                renderItem={({ item }) => (
                  <FestivalPosterCard festival={item.festival} stats={item.stats} />
                )}
                contentContainerStyle={styles.carousel}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          ))}

          {computed.topRated.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('profile.topRated')}</Text>
              {computed.topRated.map((entry, index) => (
                <View key={index} style={styles.topRow}>
                  <Text style={styles.topName} numberOfLines={1}>
                    {entry.name}
                  </Text>
                  <Text style={[styles.topRating, { color: ratingColor(entry.rating) }]}>
                    {Number(entry.rating).toFixed(0)}/20
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.xl },
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
  statsRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  statLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: { gap: spacing.md },
  sectionTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    paddingHorizontal: spacing.xl,
  },
  carousel: { gap: spacing.md, paddingHorizontal: spacing.xl },
  card: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  topName: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  topRating: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
  },
});
