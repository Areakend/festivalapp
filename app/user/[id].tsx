import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ScheduleRow } from '@/components/festival/ScheduleRow';
import { ratingColor } from '@/components/ui/RatingBar';
import { useFestivals, type CatalogItem } from '@/features/festivals/api';
import { useFriendProfile } from '@/features/friends/api';
import { useBlockUser, useMyBlockedIds } from '@/features/moderation/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';
import type { FestivalStatus } from '@/types/domain';

const SECTIONS: { status: FestivalStatus; labelKey: string; icon: string; color: string }[] = [
  { status: 'attended', labelKey: 'festival.attended', icon: 'checkmark-circle', color: colors.statusAttended },
  { status: 'planned', labelKey: 'festival.planned', icon: 'calendar', color: colors.statusPlanned },
  { status: 'wishlist', labelKey: 'festival.wishlist', icon: 'heart', color: colors.statusWishlist },
];

/**
 * A friend's public profile: stats, tracked festivals grouped exactly like
 * Home (same ScheduleRow — date block, name, meta, chevron), top ratings.
 */
export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data } = useFriendProfile(id);
  const { data: catalog } = useFestivals();
  const { data: blockedIds } = useMyBlockedIds();
  const blockUser = useBlockUser();
  const isBlocked = !!id && (blockedIds?.has(id) ?? false);

  const confirmBlockToggle = () => {
    if (!id) return;
    const name = data?.profile.display_name ?? '';
    Alert.alert(
      t('report.title'),
      isBlocked ? t('report.unblock', { name }) : t('report.block', { name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: isBlocked ? t('report.unblock', { name }) : t('report.block', { name }),
          style: isBlocked ? 'default' : 'destructive',
          onPress: () =>
            blockUser.mutate(
              { blockedId: id, blocked: isBlocked },
              {
                onSuccess: () => {
                  if (!isBlocked) Alert.alert(t('report.title'), t('report.blockDone'));
                },
                onError: (error) => Alert.alert(t('common.error'), error.message),
              },
            ),
        },
      ],
    );
  };

  const computed = useMemo(() => {
    if (!data || !catalog) return null;
    const byId = new Map(catalog.map((item) => [item.festival.id, item]));
    const sections = SECTIONS.map((section) => ({
      ...section,
      items: data.statuses
        .filter((s) => s.status === section.status)
        .map((s) => byId.get(s.festival_id))
        .filter((item): item is CatalogItem => item != null),
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  const openFestival = (item: CatalogItem) =>
    router.push({ pathname: '/festival/[slug]', params: { slug: item.festival.slug } });

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
        <Pressable onPress={confirmBlockToggle} hitSlop={12}>
          <Ionicons
            name={isBlocked ? 'ban' : 'ban-outline'}
            size={20}
            color={isBlocked ? colors.danger : colors.textMuted}
          />
        </Pressable>
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
              <View style={styles.sectionHeader}>
                <Ionicons name={section.icon as never} size={18} color={section.color} />
                <Text style={[styles.sectionTitle, { color: section.color }]}>
                  {t(section.labelKey)}
                </Text>
                <Text style={styles.sectionCount}>{section.items.length}</Text>
              </View>
              <View style={styles.list}>
                {section.items.map((item) => (
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
                    onPress={() => openFestival(item)}
                  />
                ))}
              </View>
            </View>
          ))}

          {computed.topRated.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={18} color={colors.rating} />
                <Text style={[styles.sectionTitle, { color: colors.rating }]}>
                  {t('profile.topRated')}
                </Text>
              </View>
              <View style={styles.card}>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
  },
  sectionCount: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  list: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  card: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
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
