import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

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
  /** When provided, the bar becomes a 20-segment slide/tap input. */
  onChange?: (value: number) => void;
  label?: string;
}

/**
 * /20 rating control. Input mode: drag anywhere across the 20 segments
 * (or tap one directly) to set the value — a single continuous gesture
 * reads much faster than tapping 20 separate targets one at a time.
 * Display mode: thin progress bar. Both show the "x/20" value.
 */
export function RatingBar({ value, onChange, label }: RatingBarProps) {
  const widthRef = useRef(0);

  // Callers often pass an inline arrow (e.g. sub-ratings' onChange updates a
  // record by key), which is a new function identity every render. Reading
  // it through a ref — instead of putting it in the PanResponder's dep array
  // — keeps the responder itself stable across the whole drag; recreating
  // it mid-gesture on every value change was dropping/restarting touches,
  // which read as the bar "flickering" and losing the selection.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const valueFromX = (x: number) => {
    const w = widthRef.current;
    if (w <= 0) return value;
    const clamped = Math.min(Math.max(x, 0), w);
    return Math.min(MAX, Math.max(1, Math.ceil((clamped / w) * MAX)));
  };

  const panResponder = useMemo(() => {
    if (!onChange) return null;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => onChangeRef.current?.(valueFromX(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => onChangeRef.current?.(valueFromX(e.nativeEvent.locationX)),
    });
    // Deliberately excludes `onChange` (see onChangeRef above) and `value`
    // (read via widthRef/valueFromX at gesture time, not needed here) —
    // only whether a handler exists at all should ever recreate this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!onChange]);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {onChange ? (
          <View
            style={styles.segments}
            onLayout={(e) => {
              widthRef.current = e.nativeEvent.layout.width;
            }}
            hitSlop={{ top: 12, bottom: 12 }}
            {...panResponder!.panHandlers}
          >
            {Array.from({ length: MAX }, (_, i) => i + 1).map((step) => (
              <View
                key={step}
                style={[styles.segment, step <= value && { backgroundColor: ratingColor(value) }]}
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
