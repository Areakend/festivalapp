import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Chip } from '@/components/ui/Chip';
import { ScheduleRow } from '@/components/festival/ScheduleRow';
import { RatingBar, ratingColor } from '@/components/ui/RatingBar';
import { useFestivals, useMyStatuses, type CatalogItem } from '@/features/festivals/api';
import { useFriendProfile, useFriendships, useRemoveFriendship } from '@/features/friends/api';
import { useBlockUser, useMyBlockedIds } from '@/features/moderation/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';
import type { FestivalStatus, Review } from '@/types/domain';

const SUB_RATINGS = [
  ['lineup_rating', 'review.lineupRating'],
  ['production_rating', 'review.productionRating'],
  ['side_quest_rating', 'review.sideQuestRating'],
  ['organization_rating', 'review.organizationRating'],
  ['atmosphere_rating', 'review.atmosphereRating'],
  ['value_rating', 'review.valueRating'],
] as const;

type StatusFilter = 'all' | 'attended' | 'planned' | 'wishlist';

const SECTIONS: { status: FestivalStatus; labelKey: string; icon: string; color: string }[] = [
  { status: 'attended', labelKey: 'festival.attended', icon: 'checkmark-circle', color: colors.statusAttended },
  { status: 'planned', labelKey: 'festival.planned', icon: 'calendar', color: colors.statusPlanned },
  { status: 'wishlist', labelKey: 'festival.wishlist', icon: 'heart', color: colors.statusWishlist },
];

/**
 * A user's public festival history: stats, tracked festivals grouped
 * exactly like Home (same ScheduleRow — date block, name, meta,
 * chevron), top ratings. Works for anyone whose review you tapped, not
 * just friends — see the "attended" public-read RLS policy — with a
 * status/year filter and an "in common with me" comparison.
 */
export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data } = useFriendProfile(id);
  const { data: catalog } = useFestivals();
  const { data: myStatuses } = useMyStatuses();
  const { data: blockedIds } = useMyBlockedIds();
  const blockUser = useBlockUser();
  const isBlocked = !!id && (blockedIds?.has(id) ?? false);
  const { data: friendships } = useFriendships();
  const removeFriendship = useRemoveFriendship();
  const friendshipId = friendships?.friends.find((f) => f.profile.id === id)?.friendshipId;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [commonOnly, setCommonOnly] = useState(false);
  // Each section is capped at 5 rows until expanded — profiles with long
  // histories were painfully tall to scroll otherwise.
  const [expandedSections, setExpandedSections] = useState<Set<FestivalStatus>>(new Set());
  const [countriesOpen, setCountriesOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const toggleSection = (status: FestivalStatus) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const confirmRemoveFriend = () => {
    if (!friendshipId) return;
    const name = data?.profile.display_name ?? '';
    Alert.alert(t('friends.remove'), name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('friends.remove'),
        style: 'destructive',
        onPress: () => removeFriendship.mutate(friendshipId),
      },
    ]);
  };

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

  const years = useMemo(
    () => [...new Set((data?.attendances ?? []).map((a) => a.attended_year))].sort((a, b) => b - a),
    [data],
  );

  const myAttendedIds = useMemo(
    () => new Set((myStatuses ?? []).filter((s) => s.status === 'attended').map((s) => s.festival_id)),
    [myStatuses],
  );
  const myPlannedIds = useMemo(
    () => new Set((myStatuses ?? []).filter((s) => s.status === 'planned').map((s) => s.festival_id)),
    [myStatuses],
  );
  const myWishlistIds = useMemo(
    () => new Set((myStatuses ?? []).filter((s) => s.status === 'wishlist').map((s) => s.festival_id)),
    [myStatuses],
  );

  const computed = useMemo(() => {
    if (!data || !catalog) return null;
    const byId = new Map(catalog.map((item) => [item.festival.id, item]));
    // A festival can be logged as attended in several different years —
    // keep all of them per festival (see the same fix in profile.tsx).
    const attendedYearsByFestival = new Map<string, number[]>();
    for (const a of data.attendances) {
      const years = attendedYearsByFestival.get(a.festival_id);
      if (years) years.push(a.attended_year);
      else attendedYearsByFestival.set(a.festival_id, [a.attended_year]);
    }

    const sections = SECTIONS.filter((s) => statusFilter === 'all' || s.status === statusFilter)
      .map((section) => ({
        ...section,
        items: data.statuses
          .filter((s) => s.status === section.status)
          .map((s) => byId.get(s.festival_id))
          .filter((item): item is CatalogItem => item != null)
          .filter((item) => {
            // Year filter only makes sense for logged attendance years.
            if (section.status !== 'attended' || yearFilter === 'all') return true;
            return (attendedYearsByFestival.get(item.festival.id) ?? []).includes(yearFilter);
          })
          .filter((item) => {
            if (!commonOnly) return true;
            if (section.status === 'attended') return myAttendedIds.has(item.festival.id);
            if (section.status === 'planned') return myPlannedIds.has(item.festival.id);
            if (section.status === 'wishlist') return myWishlistIds.has(item.festival.id);
            return true;
          }),
      }))
      .filter((s) => s.items.length > 0);

    const attended = data.statuses.filter((s) => s.status === 'attended');

    // Full country breakdown (not just the count) for the countries detail sheet.
    const countryCounts = new Map<string, number>();
    for (const s of attended) {
      const country = byId.get(s.festival_id)?.festival.country;
      if (!country) continue;
      countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
    }
    const countryList = [...countryCounts.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    // Full review list (not just top 5) for the reviews detail sheet.
    const reviewList = [...data.reviews]
      .sort((a, b) => b.overall_rating - a.overall_rating)
      .map((review) => ({ review, festivalName: byId.get(review.festival_id)?.festival.name ?? '—' }));

    return {
      sections,
      attendedCount: attended.length,
      countryCount: countryCounts.size,
      countryList,
      reviewList,
    };
  }, [data, catalog, statusFilter, yearFilter, commonOnly, myAttendedIds, myPlannedIds, myWishlistIds]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  const openFestival = (item: CatalogItem) =>
    router.push({ pathname: '/festival/[slug]', params: { slug: item.festival.slug } });

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
        <Text style={styles.title} numberOfLines={1}>
          {data?.profile.display_name ?? '…'}{' '}
          {data?.profile.country ? countryFlag(data.profile.country) : ''}
        </Text>
        {friendshipId && (
          <Pressable onPress={confirmRemoveFriend} hitSlop={12}>
            <Ionicons name="person-remove-outline" size={20} color={colors.textMuted} />
          </Pressable>
        )}
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
            <Stat
              value={String(computed.countryCount)}
              label={t('profile.countriesVisited')}
              onPress={computed.countryList.length > 0 ? () => setCountriesOpen(true) : undefined}
            />
            <Stat
              value={String(data!.reviews.length)}
              label={t('festival.reviews')}
              onPress={computed.reviewList.length > 0 ? () => setReviewsOpen(true) : undefined}
            />
          </View>

          {/* Filters: status, year, in-common-with-me */}
          <View style={styles.filters}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              <Chip
                label={t('common.seeAll')}
                active={statusFilter === 'all'}
                onPress={() => setStatusFilter('all')}
              />
              <Chip
                label={t('festival.attended')}
                active={statusFilter === 'attended'}
                onPress={() => setStatusFilter('attended')}
              />
              <Chip
                label={t('festival.planned')}
                active={statusFilter === 'planned'}
                onPress={() => setStatusFilter('planned')}
              />
              <Chip
                label={t('festival.wishlist')}
                active={statusFilter === 'wishlist'}
                onPress={() => setStatusFilter('wishlist')}
              />
            </ScrollView>
            {years.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                <Chip
                  label={t('profile.allYears')}
                  active={yearFilter === 'all'}
                  onPress={() => setYearFilter('all')}
                />
                {years.map((y) => (
                  <Chip
                    key={y}
                    label={String(y)}
                    active={yearFilter === y}
                    onPress={() => setYearFilter(y)}
                  />
                ))}
              </ScrollView>
            )}
            <Chip
              label={t('profile.commonWithMe')}
              active={commonOnly}
              activeColor={colors.primary}
              onPress={() => setCommonOnly((v) => !v)}
            />
          </View>

          {computed.sections.map((section) => {
            const expanded = expandedSections.has(section.status);
            const visible = expanded ? section.items : section.items.slice(0, 5);
            return (
              <View key={section.status} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name={section.icon as never} size={18} color={section.color} />
                  <Text style={[styles.sectionTitle, { color: section.color }]}>
                    {t(section.labelKey)}
                  </Text>
                  <Text style={styles.sectionCount}>{section.items.length}</Text>
                </View>
                <View style={styles.list}>
                  {visible.map((item) => (
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
                  {section.items.length > 5 && (
                    <Pressable onPress={() => toggleSection(section.status)} hitSlop={8}>
                      <Text style={styles.seeMore}>
                        {expanded
                          ? t('common.seeLess')
                          : `${t('common.seeAll')} (${section.items.length})`}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
          {computed.sections.length === 0 && (
            <Text style={styles.empty}>{t('empty.noResults')}</Text>
          )}
        </>
      )}

      {/* Countries detail sheet */}
      <Modal visible={countriesOpen} transparent animationType="slide" onRequestClose={() => setCountriesOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCountriesOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.sheetTitle}>{t('profile.countriesVisited')}</Text>
          <ScrollView style={styles.sheetScroll}>
            {(computed?.countryList ?? []).map(({ country, count }) => (
              <View key={country} style={styles.sheetRow}>
                <Text style={styles.sheetRowText}>
                  {countryFlag(country)} {country}
                </Text>
                <Text style={styles.sheetRowCount}>{count}</Text>
              </View>
            ))}
          </ScrollView>
          <Pressable style={styles.sheetClose} onPress={() => setCountriesOpen(false)}>
            <Text style={styles.sheetCloseText}>{t('common.done')}</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Reviews detail sheet — tap a row to expand the full rating +
          comment, tap again to collapse. */}
      <Modal
        visible={reviewsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewsOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            setReviewsOpen(false);
            setExpandedReviewId(null);
          }}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.sheetTitle}>{t('festival.reviews')}</Text>
          <ScrollView style={styles.sheetScroll}>
            {(computed?.reviewList ?? []).map(({ review, festivalName }) => {
              const expanded = expandedReviewId === review.id;
              return (
                <Pressable
                  key={review.id}
                  style={styles.reviewCard}
                  onPress={() => setExpandedReviewId(expanded ? null : review.id)}
                >
                  <View style={styles.topRow}>
                    <Text style={styles.topName} numberOfLines={1}>
                      {festivalName}
                      {review.year ? ` · ${review.year}` : ''}
                    </Text>
                    <Text style={[styles.topRating, { color: ratingColor(review.overall_rating) }]}>
                      {Number(review.overall_rating).toFixed(0)}/20
                    </Text>
                  </View>
                  {expanded && <ReviewDetail review={review} />}
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            style={styles.sheetClose}
            onPress={() => {
              setReviewsOpen(false);
              setExpandedReviewId(null);
            }}
          >
            <Text style={styles.sheetCloseText}>{t('common.done')}</Text>
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}

/** Comment + non-null sub-ratings, shown inline when a review row expands. */
function ReviewDetail({ review }: { review: Review }) {
  const { t } = useTranslation();
  const subs = SUB_RATINGS.filter(([key]) => review[key] != null);
  return (
    <View style={styles.reviewDetail}>
      {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
      {subs.map(([key, labelKey]) => (
        <RatingBar key={key} label={t(labelKey)} value={review[key] ?? 0} />
      ))}
    </View>
  );
}

function Stat({
  value,
  label,
  onPress,
}: {
  value: string;
  label: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );
  if (!onPress) return <View style={styles.statBox}>{content}</View>;
  return (
    <Pressable style={({ pressed }) => [styles.statBox, pressed && { opacity: 0.7 }]} onPress={onPress}>
      {content}
    </Pressable>
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
  filters: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  filterRow: { gap: spacing.sm, paddingRight: spacing.xl },
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
  empty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  seeMore: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.primary,
    paddingVertical: spacing.sm,
  },
  backdrop: { flex: 1, backgroundColor: '#00000088' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
    maxHeight: '75%',
  },
  sheetTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  sheetScroll: { flexGrow: 0 },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetRowText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  sheetRowCount: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  sheetClose: { alignItems: 'center', paddingTop: spacing.sm },
  sheetCloseText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.primary,
  },
  reviewCard: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  reviewDetail: { gap: spacing.sm, paddingBottom: spacing.xs },
  reviewComment: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
