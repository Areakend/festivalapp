import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { ratingColor } from '@/components/ui/RatingBar';
import { colors, radii, spacing, typography } from '@/theme';

export interface RatingBenchmark {
  name: string;
  rating: number; // 1–20, the user's own score for that festival
}

interface RatingDuelSheetProps {
  visible: boolean;
  benchmarks: RatingBenchmark[];
  onUse: (score: number) => void;
  onClose: () => void;
}

const clampScore = (value: number) => Math.min(20, Math.max(1, Math.round(value)));

/**
 * Optional "not sure what to rate?" flow: a short series of better/same/worse
 * duels against festivals the user already rated, binary-searching the 1–20
 * range down to a suggested score. Never mandatory — it only proposes, the
 * user still confirms (or ignores) the result.
 */
export function RatingDuelSheet({ visible, benchmarks, onUse, onClose }: RatingDuelSheetProps) {
  const { t } = useTranslation();

  const [range, setRange] = useState({ lo: 1, hi: 20 });
  const [pool, setPool] = useState<RatingBenchmark[]>([]);
  const [suggestion, setSuggestion] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setRange({ lo: 1, hi: 20 });
      setPool(benchmarks);
      setSuggestion(null);
    }
    // Restart only when (re)opened — benchmarks can't change mid-duel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Next opponent: the rated festival closest to the middle of what's still
  // possible. When none is left in range, the duel is over.
  const pivot = useMemo(() => {
    if (suggestion != null) return null;
    const inRange = pool.filter((b) => b.rating >= range.lo && b.rating <= range.hi);
    if (inRange.length === 0) return null;
    const mid = (range.lo + range.hi) / 2;
    return inRange.reduce((best, b) =>
      Math.abs(b.rating - mid) < Math.abs(best.rating - mid) ? b : best,
    );
  }, [pool, range, suggestion]);

  // Out of opponents — settle on the middle of the remaining range.
  useEffect(() => {
    if (visible && pivot == null && suggestion == null) {
      setSuggestion(clampScore((range.lo + range.hi) / 2));
    }
  }, [visible, pivot, suggestion, range]);

  const answer = (verdict: 'better' | 'same' | 'worse') => {
    if (!pivot) return;
    if (verdict === 'same') {
      setSuggestion(pivot.rating);
    } else if (verdict === 'better') {
      setRange((r) => ({ ...r, lo: Math.min(pivot.rating + 1, 20) }));
      setPool((p) => p.filter((b) => b.rating > pivot.rating));
    } else {
      setRange((r) => ({ ...r, hi: Math.max(pivot.rating - 1, 1) }));
      setPool((p) => p.filter((b) => b.rating < pivot.rating));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('review.duelTitle')}</Text>

        {suggestion == null && pivot ? (
          <>
            <Text style={styles.prompt}>
              {t('review.duelPrompt', { name: pivot.name, rating: pivot.rating })}
            </Text>
            <View style={styles.answers}>
              <Button label={t('review.duelBetter')} onPress={() => answer('better')} />
              <Button label={t('review.duelSame')} variant="secondary" onPress={() => answer('same')} />
              <Button label={t('review.duelWorse')} variant="secondary" onPress={() => answer('worse')} />
            </View>
          </>
        ) : suggestion != null ? (
          <>
            <Text style={styles.prompt}>{t('review.duelSuggestion')}</Text>
            <Text style={[styles.suggestedScore, { color: ratingColor(suggestion) }]}>
              {suggestion}
              <Text style={styles.suggestedMax}>/20</Text>
            </Text>
            <View style={styles.answers}>
              <Button
                label={t('review.duelUse')}
                onPress={() => {
                  onUse(suggestion);
                  onClose();
                }}
              />
              <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
            </View>
          </>
        ) : null}
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
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  prompt: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  answers: { gap: spacing.sm },
  suggestedScore: {
    fontFamily: typography.fonts.heading,
    fontSize: 48,
    textAlign: 'center',
  },
  suggestedMax: {
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
  },
});
