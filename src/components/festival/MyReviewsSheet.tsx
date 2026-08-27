import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { colors, radii, spacing, typography } from '@/theme';
import type { Review } from '@/types/domain';

interface MyReviewsSheetProps {
  visible: boolean;
  /** Already scoped to this festival and this user — one row per year
   *  reviewed, most recent first. */
  reviews: Review[];
  onClose: () => void;
  onEdit: () => void;
}

/** Tapping the "my rating" stat opens this — every year the signed-in
 *  user reviewed this festival, with their comment, instead of having to
 *  scroll to the bottom of the page and pick their own card out of the
 *  full community list. */
export function MyReviewsSheet({ visible, reviews, onClose, onEdit }: MyReviewsSheetProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('festival.myRating')}</Text>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.year}>{review.year ?? t('review.yearUnknown')}</Text>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color={colors.rating} />
                  <Text style={styles.ratingText}>{review.overall_rating.toFixed(1)}/20</Text>
                </View>
              </View>
              {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
            </View>
          ))}
        </ScrollView>
        <Button label={t('review.editReview')} onPress={onEdit} />
        <Button label={t('common.done')} variant="ghost" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000088' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
    maxHeight: '75%',
  },
  title: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  list: { flexGrow: 0 },
  listContent: { gap: spacing.md, paddingBottom: spacing.sm },
  row: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  year: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.rating,
  },
  comment: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
