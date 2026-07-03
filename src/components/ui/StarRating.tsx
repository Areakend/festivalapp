import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, spacing, typography } from '@/theme';

interface StarRatingProps {
  value: number; // 0–5
  /** When provided, stars become tappable (1–5). */
  onChange?: (value: number) => void;
  size?: number;
  label?: string;
}

/** Display or input a 1–5 star rating. Half stars render in display mode. */
export function StarRating({ value, onChange, size = 22, label }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => {
          const icon =
            value >= star ? 'star' : value >= star - 0.5 ? 'star-half' : 'star-outline';
          return (
            <Pressable
              key={star}
              disabled={!onChange}
              onPress={() => onChange?.(star)}
              hitSlop={6}
            >
              <Ionicons
                name={icon}
                size={size}
                color={value >= star - 0.5 ? colors.rating : colors.textMuted}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  stars: { flexDirection: 'row', gap: spacing.xs },
});
