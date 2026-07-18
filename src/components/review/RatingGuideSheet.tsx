import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ratingColor } from '@/components/ui/RatingBar';
import { colors, radii, spacing, typography } from '@/theme';

/**
 * Score bands for the rating guide, highest first. Each band's i18n keys are
 * `review.<key>` (short label, also shown live under the rating bar) and
 * `review.<key>Desc` (one-sentence description, guide sheet only).
 */
export const RATING_BANDS = [
  { min: 18, max: 20, key: 'guideBand18' },
  { min: 15, max: 17, key: 'guideBand15' },
  { min: 12, max: 14, key: 'guideBand12' },
  { min: 9, max: 11, key: 'guideBand9' },
  { min: 5, max: 8, key: 'guideBand5' },
  { min: 1, max: 4, key: 'guideBand1' },
] as const;

export function ratingBandKey(value: number): string {
  return (RATING_BANDS.find((b) => value >= b.min) ?? RATING_BANDS[5]).key;
}

interface RatingGuideSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Rating calibration guide, opened from the "?" button next to the overall
 * rating. Exists to fight grade inflation: it anchors each score band to a
 * worldwide standard ("is this really Tomorrowland-tier?") instead of
 * letting a great weekend at a small local festival drift into 18/20.
 */
export function RatingGuideSheet({ visible, onClose }: RatingGuideSheetProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('review.guideTitle')}</Text>
        </View>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <Text style={styles.intro}>{t('review.guideIntro')}</Text>
          <View style={styles.questionBox}>
            <Text style={styles.question}>{t('review.guideQuestion')}</Text>
          </View>
          {RATING_BANDS.map((band) => (
            <View key={band.key} style={styles.bandRow}>
              <Text style={[styles.bandRange, { color: ratingColor(band.min) }]}>
                {band.min}–{band.max}
              </Text>
              <View style={styles.bandText}>
                <Text style={styles.bandLabel}>{t(`review.${band.key}`)}</Text>
                <Text style={styles.bandDesc}>{t(`review.${band.key}Desc`)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
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
    maxHeight: '80%',
    paddingBottom: spacing.xxl,
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  list: { paddingHorizontal: spacing.xl },
  listContent: { gap: spacing.md, paddingBottom: spacing.lg },
  intro: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  questionBox: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  question: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
    lineHeight: 20,
  },
  bandRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  bandRange: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    width: 56,
  },
  bandText: { flex: 1, gap: 2 },
  bandLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  bandDesc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
