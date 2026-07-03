import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StarRating } from '@/components/ui/StarRating';
import { colors, radii, spacing, typography } from '@/theme';
import type { ReviewWithAuthor } from '@/features/reviews/api';

/** A single community review: author, rating, optional comment, date. */
export function ReviewCard({ review }: { review: ReviewWithAuthor }) {
  const { i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(review.created_at));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.author} numberOfLines={1}>
          {review.profiles?.display_name ?? '—'}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <StarRating value={review.overall_rating} size={16} />
      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  author: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.text,
    flexShrink: 1,
  },
  date: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  comment: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 21,
  },
});
