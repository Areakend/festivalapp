import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { RatingBar, ratingColor } from '@/components/ui/RatingBar';
import { useFestivalDetail } from '@/features/festivals/api';
import { useDeleteReview, useMyReview, useUpsertReview } from '@/features/reviews/api';
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
  const { data: myReview, isFetched } = useMyReview(detail?.festival.id);
  const upsert = useUpsertReview();
  const deleteReview = useDeleteReview();

  const [overall, setOverall] = useState(0);
  const [comment, setComment] = useState('');
  const [subs, setSubs] = useState<Record<SubRatingKey, number>>({
    lineup_rating: 0,
    production_rating: 0,
    side_quest_rating: 0,
    organization_rating: 0,
    atmosphere_rating: 0,
    value_rating: 0,
  });

  // Prefill when editing an existing review.
  useEffect(() => {
    if (!myReview) return;
    setOverall(Math.round(myReview.overall_rating));
    setComment(myReview.comment ?? '');
    setSubs((prev) => {
      const next = { ...prev };
      SUB_RATINGS.forEach((key) => {
        next[key] = myReview[key] ?? 0;
      });
      return next;
    });
  }, [myReview]);

  const submit = async () => {
    if (!detail || overall < 1) return;
    try {
      await upsert.mutateAsync({
        festivalId: detail.festival.id,
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

      {/* Overall /20 — big score + tap bar */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('review.yourRating')} *</Text>
        <Text style={[styles.bigScore, overall > 0 && { color: ratingColor(overall) }]}>
          {overall > 0 ? overall : '–'}
          <Text style={styles.bigScoreMax}>/20</Text>
        </Text>
        <RatingBar value={overall} onChange={setOverall} />
      </View>

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
        disabled={overall < 1 || !isFetched}
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
