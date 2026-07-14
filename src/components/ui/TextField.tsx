import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radii, spacing, typography } from '@/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, secureTextEntry, ...inputProps }, ref) => {
    // Only password-type fields get the reveal toggle; everything else
    // behaves exactly as before.
    const [revealed, setRevealed] = useState(false);
    const isPassword = !!secureTextEntry;

    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrap}>
          <TextInput
            ref={ref}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              isPassword && styles.inputWithIcon,
              !!error && styles.inputError,
            ]}
            secureTextEntry={isPassword && !revealed}
            {...inputProps}
          />
          {isPassword && (
            <Pressable
              style={styles.reveal}
              onPress={() => setRevealed((v) => !v)}
              hitSlop={10}
            >
              <Ionicons
                name={revealed ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  },
);

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  inputWrap: { position: 'relative', justifyContent: 'center' },
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
  inputWithIcon: { paddingRight: spacing.xxxl },
  inputError: { borderColor: colors.danger },
  reveal: {
    position: 'absolute',
    right: spacing.lg,
    padding: spacing.xs,
  },
  error: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.danger,
  },
});
