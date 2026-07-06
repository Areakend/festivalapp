import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { signUpSchema, type SignUpInput } from '@/features/auth/schemas';
import { checkUsernameAvailable, signUpWithEmail, signInWithGoogle } from '@/features/auth/api';
import { colors, spacing, typography } from '@/theme';

export default function SignUp() {
  const { t } = useTranslation();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  const onSubmit = async (values: SignUpInput) => {
    setSubmitError(null);
    try {
      const available = await checkUsernameAvailable(values.username);
      if (!available) {
        setError('username', { message: 'auth.usernameTaken' });
        return;
      }
      await signUpWithEmail(values.email, values.password, values.username);
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
      <Text style={styles.title}>{t('auth.signUp')}</Text>

      <View style={styles.form}>
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('auth.username')}
              value={value ?? ''}
              onChangeText={onChange}
              autoCapitalize="none"
              autoComplete="username-new"
              error={errors.username && t(errors.username.message as string)}
            />
          )}
        />
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
              autoComplete="new-password"
              error={errors.password && t(errors.password.message as string)}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('auth.confirmPassword')}
              value={value ?? ''}
              onChangeText={onChange}
              secureTextEntry
              autoComplete="new-password"
              error={errors.confirmPassword && t(errors.confirmPassword.message as string)}
            />
          )}
        />

        {submitError && <Text style={styles.submitError}>{submitError}</Text>}

        <Button label={t('auth.signUp')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
        <Button
          label={t('auth.signInWithGoogle')}
          variant="secondary"
          onPress={onGoogle}
          loading={googleLoading}
        />
        <Button
          label={t('auth.haveAccount')}
          variant="ghost"
          onPress={() => router.replace('/sign-in')}
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
