import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { useFestivalDetail } from '@/features/festivals/api';
import { useMyReview, useUpsertReview } from '@/features/reviews/api';
import { colors, radii, spacing, typography } from '@/theme';

const SUB_RATINGS = [
  'lineup_rating',
  'production_rating',
  'sound_rating',
  'organization_rating',
  'atmosphere_rating',
  'value_rating',
] as const;
type SubRatingKey = (typeof SUB_RATINGS)[number];

const SUB_LABEL_KEYS: Record<SubRatingKey, string> = {
  lineup_rating: 'review.lineupRating',
  production_rating: 'review.productionRating',
  sound_rating: 'review.soundRating',
  organization_rating: 'review.organizationRating',
  atmosphere_rating: 'review.atmosphereRating',
  value_rating: 'review.valueRating',
};

/** Create or edit the signed-in user's review for a festival. */
export default function ReviewScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: detail } = useFestivalDetail(slug);
  const { data: myReview, isFetched } = useMyReview(detail?.festival.id);
  const upsert = useUpsertReview();

  const [overall, setOverall] = useState(0);
  const [comment, setComment] = useState('');
  const [subs, setSubs] = useState<Record<SubRatingKey, number>>({
    lineup_rating: 0,
    production_rating: 0,
    sound_rating: 0,
    organization_rating: 0,
    atmosphere_rating: 0,
    value_rating: 0,
  });

  // Prefill when editing an existing review.
  useEffect(() => {
    if (!myReview) return;
    setOverall(myReview.overall_rating);
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
    await upsert.mutateAsync({
      festivalId: detail.festival.id,
      overall_rating: overall,
      comment: comment.trim() || null,
      lineup_rating: subs.lineup_rating || null,
      production_rating: subs.production_rating || null,
      sound_rating: subs.sound_rating || null,
      organization_rating: subs.organization_rating || null,
      atmosphere_rating: subs.atmosphere_rating || null,
      value_rating: subs.value_rating || null,
    });
    router.back();
  };

  return (
    <Screen>
      <Text style={styles.title}>
        {myReview ? t('review.editReview') : t('festival.rateReview')}
      </Text>
      <Text style={styles.festivalName}>{detail?.festival.name ?? '…'}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('review.yourRating')} *</Text>
        <StarRating value={overall} onChange={setOverall} size={36} />
      </View>

      <View style={styles.card}>
        {SUB_RATINGS.map((key) => (
          <StarRating
            key={key}
            label={t(SUB_LABEL_KEYS[key])}
            value={subs[key]}
            onChange={(v) => setSubs((prev) => ({ ...prev, [key]: v }))}
            size={20}
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
