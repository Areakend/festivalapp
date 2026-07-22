import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useFestivalRequests, useSubmitFestivalRequest } from '@/features/festivals/api';
import { colors, radii, spacing, typography } from '@/theme';

const STATUS_LABEL_KEYS = {
  pending: 'requestFestival.statusPending',
  added: 'requestFestival.statusAdded',
  rejected: 'requestFestival.statusRejected',
} as const;

/**
 * Suggests a festival that's missing from the catalog. Submissions land in
 * a review queue (festival_requests) checked manually — nothing here ever
 * creates a festival automatically, and nobody but the submitter and the
 * app's maintainers can read a given row (see the table's RLS policies).
 */
export default function RequestFestivalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: myRequests } = useFestivalRequests();
  const submit = useSubmitFestivalRequest();

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');

  const canSubmit = name.trim().length > 0 && name.trim().length <= 200;

  const onSubmit = async () => {
    try {
      await submit.mutateAsync({
        name: name.trim(),
        country: country.trim() || null,
        website: website.trim() || null,
      });
      setName('');
      setCountry('');
      setWebsite('');
      Alert.alert(t('requestFestival.thanksTitle'), t('requestFestival.thanksBody'));
    } catch (error) {
      Alert.alert(t('common.error'), (error as Error).message);
    }
  };

  return (
    <Screen scroll>
      <Text style={styles.title}>{t('requestFestival.title')}</Text>
      <Text style={styles.intro}>{t('requestFestival.intro')}</Text>

      <View style={styles.card}>
        <TextField
          label={`${t('requestFestival.name')} *`}
          value={name}
          onChangeText={setName}
          maxLength={200}
          placeholder={t('requestFestival.namePlaceholder')}
        />
        <TextField
          label={t('requestFestival.country')}
          value={country}
          onChangeText={setCountry}
          maxLength={100}
          placeholder={t('requestFestival.countryPlaceholder')}
        />
        <TextField
          label={t('requestFestival.website')}
          value={website}
          onChangeText={setWebsite}
          maxLength={500}
          autoCapitalize="none"
          keyboardType="url"
          placeholder={t('requestFestival.websitePlaceholder')}
        />
        <Button
          label={t('requestFestival.submit')}
          onPress={() => void onSubmit()}
          loading={submit.isPending}
          disabled={!canSubmit}
        />
      </View>

      {myRequests && myRequests.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('requestFestival.yourRequests')}</Text>
          {myRequests.map((r) => (
            <View key={r.id} style={styles.requestRow}>
              <Text style={styles.requestName} numberOfLines={1}>
                {r.name}
              </Text>
              <Text style={[styles.requestStatus, styles[`status_${r.status}`]]}>
                {t(STATUS_LABEL_KEYS[r.status])}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Button label={t('common.done')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginTop: spacing.xl,
  },
  intro: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requestName: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  requestStatus: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.xs,
  },
  status_pending: { color: colors.textMuted },
  status_added: { color: colors.success },
  status_rejected: { color: colors.danger },
});
