import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

const MAX = 20;

/** Score color: red < 8, amber < 14, green ≥ 14 — instant readability. */
export function ratingColor(value: number): string {
  if (value < 8) return colors.danger;
  if (value < 14) return colors.rating;
  return colors.success;
}

interface RatingBarProps {
  value: number; // 0–20 (0 = not rated yet)
  /** When provided, the bar becomes a 20-segment tap input. */
  onChange?: (value: number) => void;
  label?: string;
}

/**
 * /20 rating control. Input mode: 20 tappable segments.
 * Display mode: thin progress bar. Both show the "x/20" value.
 */
export function RatingBar({ value, onChange, label }: RatingBarProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {onChange ? (
          <View style={styles.segments}>
            {Array.from({ length: MAX }, (_, i) => i + 1).map((step) => (
              <Pressable
                key={step}
                style={[
                  styles.segment,
                  step <= value && { backgroundColor: ratingColor(value) },
                ]}
                onPress={() => onChange(step)}
                hitSlop={{ top: 10, bottom: 10 }}
              />
            ))}
          </View>
        ) : (
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${(value / MAX) * 100}%`, backgroundColor: ratingColor(value) },
              ]}
            />
          </View>
        )}
        <Text style={[styles.value, value > 0 && { color: ratingColor(value) }]}>
          {value > 0 ? `${Number.isInteger(value) ? value : value.toFixed(1)}/20` : '–/20'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  segments: { flex: 1, flexDirection: 'row', gap: 2 },
  segment: {
    flex: 1,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.surfaceElevated,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.full },
  value: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    width: 52,
    textAlign: 'right',
  },
});
