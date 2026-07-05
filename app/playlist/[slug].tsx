import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { useFestivalDetail } from '@/features/festivals/api';
import { useSpotifyConnection, useConnectSpotify, useGeneratePlaylist } from '@/features/spotify/api';
import { useDeezerConnection, useConnectDeezer, useGeneratePlaylistDeezer } from '@/features/deezer/api';
import { colors, radii, spacing, typography } from '@/theme';

export default function PlaylistScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: detail } = useFestivalDetail(slug);

  const { data: spotifyConnection, isLoading: spotifyConnectionLoading } = useSpotifyConnection();
  const connectSpotify = useConnectSpotify();
  const generateSpotifyPlaylist = useGeneratePlaylist();

  const { data: deezerConnection, isLoading: deezerConnectionLoading } = useDeezerConnection();
  const connectDeezer = useConnectDeezer();
  const generateDeezerPlaylist = useGeneratePlaylistDeezer();

  const [result, setResult] = useState<Awaited<ReturnType<typeof generateSpotifyPlaylist.mutateAsync>> | null>(
    null,
  );

  const edition = detail?.editions.find((e) => e.lineup_published) ?? detail?.editions[0];

  const generate = async (provider: 'spotify' | 'deezer') => {
    if (!detail || !edition) return;
    const mutate = provider === 'spotify' ? generateSpotifyPlaylist : generateDeezerPlaylist;
    const data = await mutate.mutateAsync({
      festivalId: detail.festival.id,
      editionId: edition.id,
    });
    setResult(data);
  };

  return (
    <Screen>
      <Text style={styles.title}>{t('festival.generatePlaylist')}</Text>
      <Text style={styles.festivalName}>{detail?.festival.name ?? '…'}</Text>

      {!result && (
        <>
          {/* Spotify */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spotify</Text>
            {!spotifyConnectionLoading && !spotifyConnection && (
              <>
                <Text style={styles.body}>{t('spotify.connectPrompt')}</Text>
                <Button
                  label={t('profile.connectSpotify')}
                  onPress={() => connectSpotify.mutate()}
                  loading={connectSpotify.isPending}
                />
              </>
            )}
            {spotifyConnection && (
              <>
                <Button
                  label={
                    generateSpotifyPlaylist.isPending
                      ? t('spotify.generating')
                      : t('festival.generatePlaylist')
                  }
                  onPress={() => void generate('spotify')}
                  loading={generateSpotifyPlaylist.isPending}
                  disabled={!edition}
                />
                {generateSpotifyPlaylist.isError && (
                  <Text style={styles.error}>{(generateSpotifyPlaylist.error as Error).message}</Text>
                )}
              </>
            )}
          </View>

          {/* Deezer */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Deezer</Text>
            {!deezerConnectionLoading && !deezerConnection && (
              <>
                <Text style={styles.body}>{t('deezer.connectPrompt')}</Text>
                <Button
                  label={t('profile.connectDeezer')}
                  onPress={() => connectDeezer.mutate()}
                  loading={connectDeezer.isPending}
                />
              </>
            )}
            {deezerConnection && (
              <>
                <Button
                  label={
                    generateDeezerPlaylist.isPending
                      ? t('spotify.generating')
                      : t('festival.generatePlaylist')
                  }
                  onPress={() => void generate('deezer')}
                  loading={generateDeezerPlaylist.isPending}
                  disabled={!edition}
                />
                {generateDeezerPlaylist.isError && (
                  <Text style={styles.error}>{(generateDeezerPlaylist.error as Error).message}</Text>
                )}
              </>
            )}
          </View>
        </>
      )}

      {result && (
        <View style={styles.card}>
          <StatRow label={t('spotify.artistsFound')} value={String(result.totalArtists)} />
          <StatRow label={t('spotify.artistsMatched')} value={String(result.matchedArtists)} />
          <StatRow label={t('spotify.tracksAdded')} value={String(result.totalTracks)} />
          {result.skippedArtists.length > 0 && (
            <Text style={styles.skipped}>
              {t('spotify.skippedArtists')}: {result.skippedArtists.join(', ')}
            </Text>
          )}
          <Button label={t('spotify.openInPlaylistApp')} onPress={() => void Linking.openURL(result.playlistUrl)} />
        </View>
      )}

      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginTop: spacing.xl,
  },
  festivalName: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.primary,
    marginBottom: spacing.lg,
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
  cardTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  body: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  error: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.danger,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  statValue: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  skipped: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
