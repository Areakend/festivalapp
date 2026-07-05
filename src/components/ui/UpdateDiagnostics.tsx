import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';

import { Button } from '@/components/ui/Button';
import { colors, radii, spacing, typography } from '@/theme';

/**
 * Shows which build/update is actually running on this device, with a
 * manual "check now" button. Used on the profile screen AND on the
 * sign-in screen — a user stuck unable to log in has no other way to
 * confirm whether a fix has actually reached their device.
 */
export function UpdateDiagnostics() {
  const [checking, setChecking] = useState(false);

  const checkForUpdate = async () => {
    setChecking(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        Alert.alert('Mises à jour', `Aucune mise à jour trouvée. Raison : ${result.reason ?? '—'}`);
        return;
      }
      await Updates.fetchUpdateAsync();
      Alert.alert('Mises à jour', 'Nouvelle version téléchargée, l’app va redémarrer.', [
        { text: 'OK', onPress: () => void Updates.reloadAsync() },
      ]);
    } catch (error) {
      Alert.alert('Mises à jour', error instanceof Error ? error.message : String(error));
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Diagnostics</Text>
      <Text style={styles.line}>Updates activées : {Updates.isEnabled ? 'oui' : 'non'}</Text>
      <Text style={styles.line}>
        Lancement : {Updates.isEmbeddedLaunch ? 'bundle embarqué (build)' : 'mise à jour OTA'}
      </Text>
      <Text style={styles.line}>Update ID : {Updates.updateId ?? '—'}</Text>
      <Text style={styles.line}>Channel : {Updates.channel ?? '—'}</Text>
      <Text style={styles.line}>Runtime version : {Updates.runtimeVersion ?? '—'}</Text>
      <Text style={styles.line}>
        Publiée le : {Updates.createdAt ? Updates.createdAt.toLocaleString() : '—'}
      </Text>
      <Button
        label="Vérifier les mises à jour"
        variant="secondary"
        onPress={() => void checkForUpdate()}
        loading={checking}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  line: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
