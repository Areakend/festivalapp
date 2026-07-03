import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, ...inputProps }, ref) => (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, !!error && styles.inputError]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  ),
);

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
    minHeight: 50,
  },
  inputError: { borderColor: colors.danger },
  error: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.danger,
  },
});
