import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  /** Accent color when active (defaults to brand primary). */
  activeColor?: string;
}

/** Small rounded chip used for filters, genres and tracking statuses. */
export function Chip({ label, active = false, onPress, activeColor = colors.primary }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.base,
        active && { backgroundColor: `${activeColor}26`, borderColor: activeColor },
      ]}
    >
      <Text style={[styles.label, active && { color: activeColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
