import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ratingColor } from '@/components/ui/RatingBar';
import { colors, radii, spacing, typography } from '@/theme';
import type { ReviewWithAuthor } from '@/features/reviews/api';

/** A single community review: author, /20 score badge, optional comment, date. */
export function ReviewCard({ review }: { review: ReviewWithAuthor }) {
  const { i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(review.created_at));
  const color = ratingColor(review.overall_rating);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.author} numberOfLines={1}>
          {review.profiles?.display_name ?? '—'}
          {review.year ? <Text style={styles.year}> · {review.year}</Text> : null}
        </Text>
        <View style={[styles.badge, { borderColor: color }]}>
          <Text style={[styles.badgeText, { color }]}>
            {Number(review.overall_rating).toFixed(0)}/20
          </Text>
        </View>
      </View>
      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
      <Text style={styles.date}>{date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  author: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.text,
    flexShrink: 1,
  },
  year: {
    fontFamily: typography.fonts.body,
    color: colors.textMuted,
  },
  badge: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
  },
  comment: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  date: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
