import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useMemo, useState } from 'react';

import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { RatingBar } from '@/components/ui/RatingBar';
import { ReviewCard } from '@/components/review/ReviewCard';
import {
  useEditionLineup,
  useFestivalDetail,
  useMyStatuses,
  useToggleStatus,
} from '@/features/festivals/api';
import { useFestivalReviews, useMyReview, type ReviewSort } from '@/features/reviews/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag, formatCompact } from '@/utils/format';
import type { FestivalStatus } from '@/types/domain';

const STATUS_CONFIG: { status: FestivalStatus; icon: string; color: string; labelKey: string }[] = [
  { status: 'attended', icon: 'checkmark-circle', color: colors.statusAttended, labelKey: 'festival.attended' },
  { status: 'planned', icon: 'calendar', color: colors.statusPlanned, labelKey: 'festival.planned' },
  { status: 'wishlist', icon: 'heart', color: colors.statusWishlist, labelKey: 'festival.wishlist' },
  { status: 'favorite', icon: 'star', color: colors.statusFavorite, labelKey: 'festival.favorite' },
];

export default function FestivalDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reviewSort, setReviewSort] = useState<ReviewSort>('newest');
  const { data, isLoading } = useFestivalDetail(slug);
  const { data: myStatuses } = useMyStatuses();
  const { data: reviews } = useFestivalReviews(data?.festival.id, reviewSort);
  const { data: myReview } = useMyReview(data?.festival.id);
  const toggleStatus = useToggleStatus();

  const lineupEdition = data?.editions.find((e) => e.lineup_published);
  const { data: lineup } = useEditionLineup(lineupEdition?.id);

  // Average of each sub-rating across all community reviews (only rated ones).
  const subAverages = useMemo(() => {
    const defs = [
      { key: 'lineup_rating', label: t('review.lineupRating') },
      { key: 'production_rating', label: t('review.productionRating') },
      { key: 'side_quest_rating', label: t('review.sideQuestRating') },
      { key: 'organization_rating', label: t('review.organizationRating') },
      { key: 'atmosphere_rating', label: t('review.atmosphereRating') },
      { key: 'value_rating', label: t('review.valueRating') },
    ] as const;
    return defs
      .map(({ key, label }) => {
        const values = (reviews ?? [])
          .map((r) => r[key])
          .filter((v): v is number => v != null);
        return {
          key,
          label,
          value: values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0,
        };
      })
      .filter((entry) => entry.value > 0);
  }, [reviews, t]);

  if (isLoading || !data) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const { festival, editions, rankings, stats } = data;
  const hasLineup = editions.some((e) => e.lineup_published);
  const activeStatuses = new Set(
    (myStatuses ?? [])
      .filter((s) => s.festival_id === festival.id)
      .map((s) => s.status),
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
    >
      {/* Header / cover */}
      <View style={[styles.cover, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        {festival.cover_image_url ? (
          <Image
            source={{ uri: festival.cover_image_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Text style={styles.coverLetter}>{festival.name.charAt(0)}</Text>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>{festival.name}</Text>
        <Text style={styles.location}>
          {countryFlag(festival.country)} {[festival.city, festival.venue].filter(Boolean).join(' · ')}
        </Text>

        <View style={styles.genreRow}>
          {festival.genres.map((g) => (
            <Chip key={g} label={g} />
          ))}
        </View>

        {/* Tracking actions */}
        <View style={styles.statusRow}>
          {STATUS_CONFIG.map(({ status, icon, color, labelKey }) => {
            const active = activeStatuses.has(status);
            return (
              <Pressable
                key={status}
                style={[styles.statusButton, active && { borderColor: color, backgroundColor: `${color}1A` }]}
                onPress={() =>
                  toggleStatus.mutate({ festivalId: festival.id, status, active })
                }
              >
                <Ionicons
                  name={(active ? icon : `${icon}-outline`) as never}
                  size={22}
                  color={active ? color : colors.textSecondary}
                />
                <Text style={[styles.statusLabel, active && { color }]}>{t(labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>{t('festival.stats')}</Text>
        <View style={styles.statsGrid}>
          <StatBox
            label={t('festival.communityRating')}
            value={stats && stats.rating_count > 0 ? `${stats.avg_rating.toFixed(1)}/20` : '–'}
            hint={stats ? t('festival.ratingsCount', { count: stats.rating_count }) : undefined}
          />
          <StatBox
            label={t('festival.bestRank')}
            value={festival.best_djmag_rank != null ? `#${festival.best_djmag_rank}` : '–'}
          />
          <StatBox label={t('festival.stages')} value={festival.number_of_stages?.toString() ?? '–'} />
          <StatBox
            label={t('festival.capacity')}
            value={festival.capacity != null ? formatCompact(festival.capacity, i18n.language) : '–'}
          />
        </View>

        {/* Rating breakdown — community averages per category */}
        {subAverages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('review.breakdown')}</Text>
            <View style={styles.breakdownCard}>
              {subAverages.map(({ key, label, value }) => (
                <RatingBar key={key} label={label} value={value} />
              ))}
            </View>
          </>
        )}

        {/* Description */}
        {festival.description && <Text style={styles.description}>{festival.description}</Text>}

        {/* Lineup of the most recent published edition */}
        {lineupEdition && lineup && lineup.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {t('festival.lineup')} · {lineupEdition.year}
            </Text>
            <View style={styles.lineupWrap}>
              {lineup.map((entry) => (
                <Chip key={entry.artists.id} label={entry.artists.name} />
              ))}
            </View>
          </>
        )}

        {/* DJ Mag ranking history */}
        {rankings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('festival.rankingHistory')}</Text>
            <View style={styles.rankingList}>
              {rankings.map((r) => (
                <View key={r.id} style={styles.rankingRow}>
                  <Text style={styles.rankingYear}>{r.year}</Text>
                  <Text style={styles.rankingPos}>#{r.rank_position}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Reviews */}
        <Text style={styles.sectionTitle}>{t('festival.reviews')}</Text>
        <View style={styles.sortRow}>
          <Chip
            label={t('review.sortNewest')}
            active={reviewSort === 'newest'}
            onPress={() => setReviewSort('newest')}
          />
          <Chip
            label={t('review.sortHighest')}
            active={reviewSort === 'highest'}
            onPress={() => setReviewSort('highest')}
          />
        </View>
        {reviews && reviews.length > 0 ? (
          <View style={styles.reviewList}>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </View>
        ) : (
          <Text style={styles.noReviews}>{t('empty.noReviews')}</Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={myReview ? t('review.editReview') : t('festival.rateReview')}
            onPress={() => router.push({ pathname: '/review/[slug]', params: { slug } })}
          />
          <Button
            label={t('festival.generatePlaylist')}
            variant="secondary"
            onPress={() => router.push({ pathname: '/playlist/[slug]', params: { slug } })}
            disabled={!hasLineup}
          />
          <Button
            label={t('common.share')}
            variant="ghost"
            onPress={() =>
              void Share.share({
                message: `${festival.name} — Festiq · https://github.com/Areakend/festivalapp`,
              })
            }
          />
          {festival.official_website && (
            <Button
              label={t('festival.website')}
              variant="ghost"
              onPress={() => Linking.openURL(festival.official_website!)}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    height: 200,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    position: 'absolute',
    left: spacing.lg,
    top: 0,
    marginTop: spacing.xxxl,
    backgroundColor: `${colors.background}CC`,
    borderRadius: radii.full,
    padding: spacing.sm,
    zIndex: 1,
  },
  coverLetter: {
    fontFamily: typography.fonts.heading,
    fontSize: 72,
    color: colors.primary,
  },
  body: { padding: spacing.xl, gap: spacing.md },
  name: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
  },
  location: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  lineupWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statusButton: {
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    width: '23%',
  },
  statusLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
    marginTop: spacing.lg,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statValue: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  statLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  statHint: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  description: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  rankingList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
  },
  rankingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rankingYear: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  rankingPos: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.rating,
  },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  sortRow: { flexDirection: 'row', gap: spacing.sm },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  reviewList: { gap: spacing.md },
  noReviews: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
