import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as SecureStore from 'expo-secure-store';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { RatingBar, ratingColor } from '@/components/ui/RatingBar';
import { RatingGuideSheet, ratingBandKey } from '@/components/review/RatingGuideSheet';
import { RatingDuelSheet, type RatingBenchmark } from '@/components/review/RatingDuelSheet';
import { AttendanceYearSheet } from '@/components/ui/AttendanceYearSheet';
import { useAddAttendance, useFestivalDetail, useFestivals, useMyAttendances } from '@/features/festivals/api';
import { useDeleteReview, useMyReview, useMyReviews, useUpsertReview } from '@/features/reviews/api';
import { colors, radii, spacing, typography } from '@/theme';

const SUB_RATINGS = [
  'lineup_rating',
  'production_rating',
  'side_quest_rating',
  'organization_rating',
  'atmosphere_rating',
  'value_rating',
] as const;
type SubRatingKey = (typeof SUB_RATINGS)[number];

const SUB_LABEL_KEYS: Record<SubRatingKey, string> = {
  lineup_rating: 'review.lineupRating',
  production_rating: 'review.productionRating',
  side_quest_rating: 'review.sideQuestRating',
  organization_rating: 'review.organizationRating',
  atmosphere_rating: 'review.atmosphereRating',
  value_rating: 'review.valueRating',
};

/** Create or edit the signed-in user's /20 review for a festival. */
export default function ReviewScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: detail } = useFestivalDetail(slug);
  const { data: myAttendances } = useMyAttendances();
  const { data: catalog } = useFestivals();
  const { data: myReviews } = useMyReviews();
  const upsert = useUpsertReview();
  const deleteReview = useDeleteReview();
  const addAttendance = useAddAttendance();

  const attendedYears = (myAttendances ?? [])
    .filter((a) => a.festival_id === detail?.festival.id)
    .map((a) => a.attended_year)
    .sort((a, b) => b - a);

  const [overall, setOverall] = useState(0);
  const [year, setYear] = useState<number | null>(null);
  const [yearSheetOpen, setYearSheetOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [duelOpen, setDuelOpen] = useState(false);

  // First-ever review: open the rating guide once, automatically, so every
  // new reviewer sees the calibration scale before their first score.
  useEffect(() => {
    void (async () => {
      try {
        const seen = await SecureStore.getItemAsync('rating_guide_seen');
        if (!seen) {
          setGuideOpen(true);
          await SecureStore.setItemAsync('rating_guide_seen', '1');
        }
      } catch {
        // Storage unavailable — skip the auto-open rather than block rating.
      }
    })();
  }, []);

  // The user's own scores for other festivals (latest year per festival) —
  // calibration anchors for both the benchmark strip and the duel flow.
  const benchmarks = useMemo<RatingBenchmark[]>(() => {
    if (!myReviews || !detail) return [];
    const nameById = new Map((catalog ?? []).map((c) => [c.festival.id, c.festival.name]));
    const byFestival = new Map<string, RatingBenchmark>();
    for (const r of [...myReviews].sort((a, b) => (a.year ?? 0) - (b.year ?? 0))) {
      if (r.festival_id === detail.festival.id) continue;
      const name = nameById.get(r.festival_id);
      if (!name) continue;
      byFestival.set(r.festival_id, { name, rating: Math.round(r.overall_rating) });
    }
    return [...byFestival.values()];
  }, [myReviews, catalog, detail]);

  // Show the 4 most useful anchors: nearest to the picked score once there
  // is one, the user's top scores before that.
  const shownBenchmarks = useMemo(() => {
    const sorted = [...benchmarks].sort((a, b) =>
      overall > 0 ? Math.abs(a.rating - overall) - Math.abs(b.rating - overall) : b.rating - a.rating,
    );
    return sorted.slice(0, 4);
  }, [benchmarks, overall]);
  const [comment, setComment] = useState('');
  const [subs, setSubs] = useState<Record<SubRatingKey, number>>({
    lineup_rating: 0,
    production_rating: 0,
    side_quest_rating: 0,
    organization_rating: 0,
    atmosphere_rating: 0,
    value_rating: 0,
  });

  // Default to the most recently attended year — silently, with no picker
  // shown, when it's the only one. With several attended years, the picker
  // below still defaults to the latest but lets you switch to write (or
  // edit) another year's review instead.
  useEffect(() => {
    if (year == null && attendedYears[0] != null) setYear(attendedYears[0]);
  }, [attendedYears, year]);

  const { data: myReview, isFetched } = useMyReview(detail?.festival.id, year);

  // Tracks the last *real* (non-null) year this effect has settled on, so a
  // blank-form reset only fires when deliberately switching between two
  // already-picked years (attendedYears.length > 1) — not when a year is
  // being set for the first time after the user already started filling in
  // the form (year starts null, e.g. no attended years yet).
  const lastSettledYearRef = useRef<number | null>(null);

  // One review per (user, festival, year) — switching between two picked
  // years reloads whichever review exists for the new one, or clears the
  // form for a brand new one. Gated on isFetched so this only reacts once
  // the query for the *current* year has actually settled — otherwise the
  // transient `undefined` while React Query refetches for a new year key
  // would itself look like "no review", wiping whatever the user had typed
  // before a year was even picked.
  useEffect(() => {
    if (!isFetched) return;
    const cameFromRealYear = lastSettledYearRef.current != null;
    lastSettledYearRef.current = year;

    if (myReview) {
      setOverall(Math.round(myReview.overall_rating));
      setComment(myReview.comment ?? '');
      setSubs((prev) => {
        const next = { ...prev };
        SUB_RATINGS.forEach((key) => {
          next[key] = myReview[key] ?? 0;
        });
        return next;
      });
    } else if (cameFromRealYear) {
      setOverall(0);
      setComment('');
      setSubs({
        lineup_rating: 0,
        production_rating: 0,
        side_quest_rating: 0,
        organization_rating: 0,
        atmosphere_rating: 0,
        value_rating: 0,
      });
    }
  }, [myReview, isFetched, year]);

  const submit = async () => {
    if (!detail || overall < 1 || year == null) return;
    try {
      await upsert.mutateAsync({
        festivalId: detail.festival.id,
        year,
        overall_rating: overall,
        comment: comment.trim() || null,
        lineup_rating: subs.lineup_rating || null,
        production_rating: subs.production_rating || null,
        side_quest_rating: subs.side_quest_rating || null,
        organization_rating: subs.organization_rating || null,
        atmosphere_rating: subs.atmosphere_rating || null,
        value_rating: subs.value_rating || null,
      });
      router.back();
    } catch (error) {
      Alert.alert(t('common.error'), (error as Error).message);
    }
  };

  const confirmDelete = () => {
    if (!detail || !myReview) return;
    Alert.alert(t('common.delete'), detail.festival.name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteReview.mutate(
            { reviewId: myReview.id, festivalId: detail.festival.id },
            {
              onSuccess: () => router.back(),
              onError: (error) => Alert.alert(t('common.error'), error.message),
            },
          );
        },
      },
    ]);
  };

  return (
    <Screen>
      <Text style={styles.title}>
        {myReview ? t('review.editReview') : t('festival.rateReview')}
      </Text>
      <Text style={styles.festivalName}>{detail?.festival.name ?? '…'}</Text>

      {/* Which year this review is about — mandatory. Skipped entirely
          (used directly, no picker) when there's only one attended year.
          With several, switching years loads that year's review (or
          starts a blank one) instead of overwriting another year's. With
          none yet, picking one here also logs it as an attended year. */}
      {attendedYears.length > 1 ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('review.year')} *</Text>
          <View style={styles.yearRow}>
            {attendedYears.map((y) => (
              <Chip key={y} label={String(y)} active={year === y} onPress={() => setYear(y)} />
            ))}
          </View>
        </View>
      ) : attendedYears.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('review.year')} *</Text>
          <Button
            label={year != null ? String(year) : t('review.pickYear')}
            variant={year != null ? 'primary' : 'secondary'}
            onPress={() => setYearSheetOpen(true)}
          />
        </View>
      ) : null}

      <AttendanceYearSheet
        visible={yearSheetOpen}
        recordedYears={year != null ? [year] : []}
        fromYear={detail?.festival.first_year ?? new Date().getFullYear() - 30}
        onSelect={(y) => {
          setYear(y);
          if (detail) addAttendance.mutate({ festivalId: detail.festival.id, year: y });
          setYearSheetOpen(false);
        }}
        onClose={() => setYearSheetOpen(false)}
      />

      {/* Overall /20 — big score + tap bar. The "?" opens the calibration
          guide and the live band label anchors the picked score to it, both
          nudging against small-festival grade inflation. */}
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <Text style={styles.sectionLabel}>{t('review.yourRating')} *</Text>
          <Pressable onPress={() => setGuideOpen(true)} hitSlop={12}>
            <Ionicons name="help-circle-outline" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
        <Text style={[styles.bigScore, overall > 0 && { color: ratingColor(overall) }]}>
          {overall > 0 ? overall : '–'}
          <Text style={styles.bigScoreMax}>/20</Text>
        </Text>
        {overall > 0 && (
          <Text style={[styles.bandHint, { color: ratingColor(overall) }]}>
            {t(`review.${ratingBandKey(overall)}`)}
          </Text>
        )}
        <RatingBar value={overall} onChange={setOverall} />

        {/* Personal calibration: the user's own scores for other festivals,
            re-sorted to the nearest ones once a score is picked — "is this
            really better than the 16 I gave Dour?". */}
        {shownBenchmarks.length > 0 && (
          <>
            <Text style={styles.benchmarksLabel}>{t('review.benchmarks')}</Text>
            <View style={styles.benchmarkRow}>
              {shownBenchmarks.map((b) => (
                <View key={b.name} style={styles.benchmarkChip}>
                  <Text style={styles.benchmarkName} numberOfLines={1}>
                    {b.name}
                  </Text>
                  <Text style={[styles.benchmarkScore, { color: ratingColor(b.rating) }]}>
                    {b.rating}/20
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
        {benchmarks.length >= 2 && (
          <Pressable onPress={() => setDuelOpen(true)} hitSlop={8}>
            <Text style={styles.duelLink}>{t('review.duelEntry')}</Text>
          </Pressable>
        )}
      </View>

      <RatingGuideSheet visible={guideOpen} onClose={() => setGuideOpen(false)} />
      <RatingDuelSheet
        visible={duelOpen}
        benchmarks={benchmarks}
        onUse={setOverall}
        onClose={() => setDuelOpen(false)}
      />

      {/* Sub-ratings /20 */}
      <View style={styles.card}>
        {SUB_RATINGS.map((key) => (
          <RatingBar
            key={key}
            label={t(SUB_LABEL_KEYS[key])}
            value={subs[key]}
            onChange={(v) => setSubs((prev) => ({ ...prev, [key]: v }))}
          />
        ))}
      </View>

      <TextInput
        style={styles.comment}
        placeholder={t('review.comment')}
        placeholderTextColor={colors.textMuted}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={4000}
      />

      <Button
        label={t('review.submit')}
        onPress={() => void submit()}
        loading={upsert.isPending}
        disabled={overall < 1 || year == null || !isFetched}
      />
      {myReview && (
        <Button
          label={t('common.delete')}
          variant="ghost"
          onPress={confirmDelete}
          loading={deleteReview.isPending}
        />
      )}
      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginTop: spacing.xl,
  },
  festivalName: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  yearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bandHint: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: -spacing.xs,
  },
  benchmarksLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  benchmarkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  benchmarkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    maxWidth: '100%',
  },
  benchmarkName: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  benchmarkScore: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
  },
  duelLink: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.accent,
    textAlign: 'center',
  },
  bigScore: {
    fontFamily: typography.fonts.heading,
    fontSize: 48,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bigScoreMax: {
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
  },
  comment: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    minHeight: 110,
    textAlignVertical: 'top',
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.lg,
  },
});
