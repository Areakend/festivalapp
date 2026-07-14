import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ratingColor } from '@/components/ui/RatingBar';
import { useSessionStore } from '@/features/auth/session-store';
import { useBlockUser, useReportReview } from '@/features/moderation/api';
import { useMyReviewVotes, useToggleReviewVote } from '@/features/reviews/api';
import { colors, radii, spacing, typography } from '@/theme';
import type { ReviewWithAuthor } from '@/features/reviews/api';

/**
 * A single community review: author (tap to see their public festival
 * history, friends or not), /20 score badge, upvote, optional comment,
 * date — plus, on other people's reviews, the report/block menu Google
 * Play's UGC policy requires.
 */
export function ReviewCard({ review }: { review: ReviewWithAuthor }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const myUserId = useSessionStore((s) => s.session?.user.id);
  const reportReview = useReportReview();
  const blockUser = useBlockUser();
  const { data: myVotes } = useMyReviewVotes();
  const toggleVote = useToggleReviewVote();

  const date = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(review.created_at));
  const color = ratingColor(review.overall_rating);
  const authorName = review.profiles?.display_name ?? '—';
  const upvoted = myVotes?.has(review.id) ?? false;

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
        <Pressable
          style={styles.authorPress}
          onPress={() => router.push({ pathname: '/user/[id]', params: { id: review.user_id } })}
          hitSlop={4}
        >
          <Text style={styles.author} numberOfLines={1}>
            {authorName}
            {review.year ? <Text style={styles.year}> · {review.year}</Text> : null}
          </Text>
        </Pressable>
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
      <View style={styles.footer}>
        <Text style={styles.date}>{date}</Text>
        <Pressable
          style={styles.voteRow}
          onPress={() =>
            toggleVote.mutate({ reviewId: review.id, festivalId: review.festival_id, upvoted })
          }
          disabled={!myUserId}
          hitSlop={8}
        >
          <Ionicons
            name={upvoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
            size={18}
            color={upvoted ? colors.primary : colors.textMuted}
          />
          {review.upvote_count > 0 && (
            <Text style={[styles.voteCount, upvoted && { color: colors.primary }]}>
              {review.upvote_count}
            </Text>
          )}
        </Pressable>
      </View>
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
  authorPress: { flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  author: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.text,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  voteCount: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
