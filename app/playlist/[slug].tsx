import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { useFestivalDetail } from '@/features/festivals/api';
import { useFestivalPlaylistCache, useGeneratePlaylist } from '@/features/spotify/api';
import { useGeneratePlaylistExport } from '@/features/export/api';
import { colors, radii, spacing, typography } from '@/theme';
import { useQueryClient } from '@tanstack/react-query';

export default function PlaylistScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: detail } = useFestivalDetail(slug);

  const edition = detail?.editions.find((e) => e.lineup_published) ?? detail?.editions[0];

  // Shared public playlist per edition — no Spotify connection needed on
  // the user's side, see useFestivalPlaylistCache.
  const { data: playlistCache, isLoading: playlistCacheLoading } = useFestivalPlaylistCache(edition?.id);
  const generateSpotifyPlaylist = useGeneratePlaylist();

  const generateExport = useGeneratePlaylistExport();
  const [exportResult, setExportResult] = useState<Awaited<
    ReturnType<typeof generateExport.mutateAsync>
  > | null>(null);

  const generate = async () => {
    if (!detail || !edition) return;
    await generateSpotifyPlaylist.mutateAsync({
      festivalId: detail.festival.id,
      editionId: edition.id,
    });
    void queryClient.invalidateQueries({ queryKey: ['festival-playlist-cache', edition.id] });
  };

  const generateUniversalExport = async () => {
    if (!detail || !edition) return;
    const data = await generateExport.mutateAsync({
      festivalId: detail.festival.id,
      editionId: edition.id,
    });
    setExportResult(data);
  };

  return (
    <Screen>
      <Text style={styles.title}>{t('festival.generatePlaylist')}</Text>
      <Text style={styles.festivalName}>{detail?.festival.name ?? '…'}</Text>

      {/* Spotify — one shared public playlist per edition, no account needed */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Spotify</Text>
        {playlistCache ? (
          <>
            <StatRow label={t('spotify.artistsFound')} value={String(playlistCache.total_artists)} />
            <StatRow label={t('spotify.artistsMatched')} value={String(playlistCache.matched_artists)} />
            <StatRow label={t('spotify.tracksAdded')} value={String(playlistCache.total_tracks)} />
            {playlistCache.skipped_artists.length > 0 && (
              <Text style={styles.skipped}>
                {t('spotify.skippedArtists')}: {playlistCache.skipped_artists.join(', ')}
              </Text>
            )}
            <Button
              label={t('spotify.openInPlaylistApp')}
              onPress={() => void Linking.openURL(playlistCache.spotify_playlist_url)}
            />
          </>
        ) : (
          <>
            <Text style={styles.body}>{t('spotify.connectPrompt')}</Text>
            <Button
              label={generateSpotifyPlaylist.isPending ? t('spotify.generating') : t('festival.generatePlaylist')}
              onPress={() => void generate()}
              loading={generateSpotifyPlaylist.isPending || playlistCacheLoading}
              disabled={!edition}
            />
            {generateSpotifyPlaylist.isError && (
              <Text style={styles.error}>{(generateSpotifyPlaylist.error as Error).message}</Text>
            )}
          </>
        )}
      </View>

      {/* Universal export: no account needed, works even while Spotify/Deezer
          accounts can't be connected (Spotify's Premium-owner requirement,
          Deezer's closed app registration). */}
      {!exportResult && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('export.title')}</Text>
          <Text style={styles.body}>{t('export.description')}</Text>
          <Button
            label={generateExport.isPending ? t('spotify.generating') : t('export.generate')}
            variant="secondary"
            onPress={() => void generateUniversalExport()}
            loading={generateExport.isPending}
            disabled={!edition}
          />
          {generateExport.isError && (
            <Text style={styles.error}>{(generateExport.error as Error).message}</Text>
          )}
        </View>
      )}

      {exportResult && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{exportResult.playlistName}</Text>
          {exportResult.skippedArtists.length > 0 && (
            <Text style={styles.skipped}>
              {t('spotify.skippedArtists')}: {exportResult.skippedArtists.join(', ')}
            </Text>
          )}
          {exportResult.tracks.map((track, index) => (
            <View key={index} style={styles.trackRow}>
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {track.artistName}
                </Text>
              </View>
              <View style={styles.trackLinks}>
                <Button
                  label={t('export.deezer')}
                  variant="ghost"
                  onPress={() => void Linking.openURL(track.deezerUrl)}
                />
                <Button
                  label={t('export.spotify')}
                  variant="ghost"
                  onPress={() => void Linking.openURL(track.spotifySearchUrl)}
                />
              </View>
            </View>
          ))}
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
  trackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trackInfo: { flexShrink: 1, flexGrow: 1 },
  trackTitle: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  trackArtist: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  trackLinks: { flexDirection: 'row', gap: spacing.xs },
});
