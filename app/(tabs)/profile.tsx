import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { signOut } from '@/features/auth/api';
import { useSessionStore } from '@/features/auth/session-store';
import { useFestivals, useMyStatuses } from '@/features/festivals/api';
import { useMyReviews } from '@/features/reviews/api';
import { useDjMagTop100, useMyProfile, useUpdateProfile } from '@/features/profile/api';
import {
  useConnectSpotify,
  useDisconnectSpotify,
  useSpotifyConnection,
} from '@/features/spotify/api';
import { useConnectDeezer, useDisconnectDeezer, useDeezerConnection } from '@/features/deezer/api';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { colors, radii, spacing, typography } from '@/theme';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  nl: 'Nederlands',
  de: 'Deutsch',
  es: 'Español',
};

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useSessionStore((s) => s.session);

  const { data: profile } = useMyProfile();
  const { data: catalog } = useFestivals();
  const { data: myStatuses } = useMyStatuses();
  const { data: myReviews } = useMyReviews();
  const { data: djmag } = useDjMagTop100();
  const updateProfile = useUpdateProfile();
  const { data: spotifyConnection } = useSpotifyConnection();
  const connectSpotify = useConnectSpotify();
  const disconnectSpotify = useDisconnectSpotify();
  const { data: deezerConnection } = useDeezerConnection();
  const connectDeezer = useConnectDeezer();
  const disconnectDeezer = useDisconnectDeezer();

  const [name, setName] = useState('');
  useEffect(() => {
    if (profile) setName(profile.display_name);
  }, [profile]);

  // Apply the stored language preference once the profile loads.
  useEffect(() => {
    if (profile && profile.preferred_language !== i18n.language) {
      void i18n.changeLanguage(profile.preferred_language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.preferred_language]);

  const stats = useMemo(() => {
    const byId = new Map((catalog ?? []).map((item) => [item.festival.id, item.festival]));
    const attended = (myStatuses ?? []).filter((s) => s.status === 'attended');
    const countries = new Set(
      attended.map((s) => byId.get(s.festival_id)?.country).filter(Boolean),
    );
    const ratings = (myReviews ?? []).map((r) => r.overall_rating);
    const avgRating =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
    const attendedIds = new Set(attended.map((s) => s.festival_id));
    const djmagCount = (djmag?.entries ?? []).filter((e) =>
      attendedIds.has(e.festivals.id),
    ).length;
    const topRated = [...(myReviews ?? [])]
      .sort((a, b) => b.overall_rating - a.overall_rating)
      .slice(0, 3)
      .map((r) => ({ rating: r.overall_rating, name: byId.get(r.festival_id)?.name ?? '—' }));
    return { attended: attended.length, countries: countries.size, avgRating, djmagCount, topRated };
  }, [catalog, myStatuses, myReviews, djmag]);

  const changeLanguage = (lang: SupportedLanguage) => {
    void i18n.changeLanguage(lang);
    updateProfile.mutate({ preferred_language: lang });
  };

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const checkForUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        Alert.alert(
          'Mises à jour',
          `Aucune mise à jour trouvée. Raison : ${result.reason ?? '—'}`,
        );
        return;
      }
      await Updates.fetchUpdateAsync();
      Alert.alert('Mises à jour', 'Nouvelle version téléchargée, l’app va redémarrer.', [
        { text: 'OK', onPress: () => void Updates.reloadAsync() },
      ]);
    } catch (error) {
      Alert.alert('Mises à jour', error instanceof Error ? error.message : String(error));
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xxl },
      ]}
    >
      <Text style={styles.title}>{profile?.display_name ?? '…'}</Text>
      <Text style={styles.email}>{session?.user.email}</Text>

      {/* Stats grid */}
      <View style={styles.grid}>
        <StatBox value={String(stats.attended)} label={t('profile.festivalsAttended')} />
        <StatBox value={String(stats.countries)} label={t('profile.countriesVisited')} />
        <StatBox
          value={stats.avgRating != null ? `${stats.avgRating.toFixed(1)}/20` : '–'}
          label={t('profile.avgRatingGiven')}
        />
        <StatBox value={`${stats.djmagCount}/100`} label={t('djmag.title')} />
      </View>

      {/* Top rated */}
      {stats.topRated.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.topRated')}</Text>
          {stats.topRated.map((entry, index) => (
            <View key={index} style={styles.topRow}>
              <Text style={styles.topName} numberOfLines={1}>
                {entry.name}
              </Text>
              <Text style={styles.topRating}>★ {entry.rating.toFixed(1)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Edit profile */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.editProfile')}</Text>
        <TextField label={t('profile.displayName')} value={name} onChangeText={setName} />
        {name.trim() !== (profile?.display_name ?? '') && name.trim().length > 0 && (
          <Button
            label={t('common.save')}
            onPress={() => updateProfile.mutate({ display_name: name.trim() })}
            loading={updateProfile.isPending}
          />
        )}
      </View>

      {/* Language */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.language')}</Text>
        <View style={styles.langRow}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Chip
              key={lang}
              label={LANGUAGE_LABELS[lang]}
              active={i18n.language === lang}
              onPress={() => changeLanguage(lang)}
            />
          ))}
        </View>
      </View>

      {/* Spotify */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Spotify</Text>
        <Text style={styles.email}>
          {spotifyConnection ? t('profile.spotifyConnected') : t('profile.spotifyNotConnected')}
        </Text>
        {spotifyConnection ? (
          <Button
            label={t('profile.disconnectSpotify')}
            variant="ghost"
            onPress={() => disconnectSpotify.mutate()}
            loading={disconnectSpotify.isPending}
          />
        ) : (
          <Button
            label={t('profile.connectSpotify')}
            variant="secondary"
            onPress={() =>
              connectSpotify.mutate(undefined, {
                onError: (error) => Alert.alert(t('common.error'), error.message),
              })
            }
            loading={connectSpotify.isPending}
          />
        )}
      </View>

      {/* Deezer */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Deezer</Text>
        <Text style={styles.email}>
          {deezerConnection ? t('profile.deezerConnected') : t('profile.deezerNotConnected')}
        </Text>
        {deezerConnection ? (
          <Button
            label={t('profile.disconnectDeezer')}
            variant="ghost"
            onPress={() => disconnectDeezer.mutate()}
            loading={disconnectDeezer.isPending}
          />
        ) : (
          <Button
            label={t('profile.connectDeezer')}
            variant="secondary"
            onPress={() =>
              connectDeezer.mutate(undefined, {
                onError: (error) => Alert.alert(t('common.error'), error.message),
              })
            }
            loading={connectDeezer.isPending}
          />
        )}
      </View>

      {/* Diagnostics: which build/update is actually running on this device */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Diagnostics</Text>
        <Text style={styles.email}>Updates activées : {Updates.isEnabled ? 'oui' : 'non'}</Text>
        <Text style={styles.email}>
          Lancement : {Updates.isEmbeddedLaunch ? 'bundle embarqué (build)' : 'mise à jour OTA'}
        </Text>
        <Text style={styles.email}>Update ID : {Updates.updateId ?? '—'}</Text>
        <Text style={styles.email}>Channel : {Updates.channel ?? '—'}</Text>
        <Text style={styles.email}>Runtime version : {Updates.runtimeVersion ?? '—'}</Text>
        <Text style={styles.email}>
          Publiée le : {Updates.createdAt ? Updates.createdAt.toLocaleString() : '—'}
        </Text>
        <Button
          label="Vérifier les mises à jour"
          variant="secondary"
          onPress={() => void checkForUpdate()}
          loading={checkingUpdate}
        />
      </View>

      <Button
        label={t('friends.title')}
        variant="secondary"
        onPress={() => router.push('/friends')}
      />
      <Button label={t('auth.signOut')} variant="ghost" onPress={() => void signOut()} />
    </ScrollView>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
  },
  email: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: -spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statValue: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  statLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  topName: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  topRating: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.rating,
  },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
