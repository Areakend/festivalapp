import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { signInSchema, type SignInInput } from '@/features/auth/schemas';
import { signInWithEmail, signInWithGoogle } from '@/features/auth/api';
import { colors, spacing, typography } from '@/theme';

export default function SignIn() {
  const { t } = useTranslation();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (values: SignInInput) => {
    setSubmitError(null);
    try {
      await signInWithEmail(values.email, values.password);
      // Root layout guard redirects to (tabs) automatically.
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t('common.error'));
    }
  };

  const onGoogle = async () => {
    setSubmitError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>{t('auth.signIn')}</Text>

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
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('auth.password')}
              value={value ?? ''}
              onChangeText={onChange}
              secureTextEntry
              autoComplete="current-password"
              error={errors.password && t(errors.password.message as string)}
            />
          )}
        />

        {submitError && <Text style={styles.submitError}>{submitError}</Text>}

        <Button label={t('auth.signIn')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
        <Button
          label={t('auth.signInWithGoogle')}
          variant="secondary"
          onPress={onGoogle}
          loading={googleLoading}
        />
        <Button
          label={t('auth.forgotPassword')}
          variant="ghost"
          onPress={() => router.push('/forgot-password')}
        />
        <Button
          label={t('auth.noAccount')}
          variant="ghost"
          onPress={() => router.replace('/sign-up')}
        />
      </View>
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
  submitError: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.danger,
  },
});
