import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { resetPasswordSchema, type ResetPasswordInput } from '@/features/auth/schemas';
import { sendPasswordReset } from '@/features/auth/api';
import { colors, spacing, typography } from '@/theme';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetPasswordInput) => {
    setSubmitError(null);
    try {
      await sendPasswordReset(values.email);
      setSent(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t('common.error'));
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>{t('auth.resetPassword')}</Text>

      {sent ? (
        <Text style={styles.confirmation}>{t('auth.resetSent')}</Text>
      ) : (
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextField
                label={t('auth.email')}
                value={value ?? ''}
                onChangeText={onChange}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                error={errors.email && t(errors.email.message as string)}
              />
            )}
          />

          {submitError && <Text style={styles.submitError}>{submitError}</Text>}

          <Button
            label={t('auth.resetPassword')}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  form: { gap: spacing.lg },
  confirmation: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.success,
    lineHeight: 24,
  },
  submitError: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.danger,
  },
});
