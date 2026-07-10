import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ratingColor } from '@/components/ui/RatingBar';
import { useSessionStore } from '@/features/auth/session-store';
import { useBlockUser, useReportReview } from '@/features/moderation/api';
import { colors, radii, spacing, typography } from '@/theme';
import type { ReviewWithAuthor } from '@/features/reviews/api';

/**
 * A single community review: author, /20 score badge, optional comment,
 * date — plus, on other people's reviews, the report/block menu Google
 * Play's UGC policy requires.
 */
export function ReviewCard({ review }: { review: ReviewWithAuthor }) {
  const { t, i18n } = useTranslation();
  const myUserId = useSessionStore((s) => s.session?.user.id);
  const reportReview = useReportReview();
  const blockUser = useBlockUser();

  const date = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(review.created_at));
  const color = ratingColor(review.overall_rating);
  const authorName = review.profiles?.display_name ?? '—';

  const openMenu = () => {
    Alert.alert(t('report.title'), authorName, [
      {
        text: t('report.review'),
        onPress: () =>
          reportReview.mutate(
            { reviewId: review.id, reportedUserId: review.user_id },
            {
              onSuccess: () => Alert.alert(t('report.title'), t('report.reviewDone')),
              onError: (error) => Alert.alert(t('common.error'), error.message),
            },
          ),
      },
      {
        text: t('report.block', { name: authorName }),
        style: 'destructive',
        onPress: () =>
          blockUser.mutate(
            { blockedId: review.user_id, blocked: false },
            {
              onSuccess: () => Alert.alert(t('report.title'), t('report.blockDone')),
              onError: (error) => Alert.alert(t('common.error'), error.message),
            },
          ),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.author} numberOfLines={1}>
          {authorName}
          {review.year ? <Text style={styles.year}> · {review.year}</Text> : null}
        </Text>
        <View style={styles.headerRight}>
          <View style={[styles.badge, { borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>
              {Number(review.overall_rating).toFixed(0)}/20
            </Text>
          </View>
          {myUserId != null && review.user_id !== myUserId && (
            <Pressable onPress={openMenu} hitSlop={10}>
              <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
            </Pressable>
          )}
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
