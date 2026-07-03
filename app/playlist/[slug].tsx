import { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { useFestivalDetail } from '@/features/festivals/api';
import {
  useGeneratePlaylist,
  useSpotifyConnect,
  useSpotifyStatus,
  type PlaylistResult,
} from '@/features/spotify/api';
import { colors, radii, spacing, typography } from '@/theme';

/** Playlist generator: lineup → Spotify playlist (or preview if not connected). */
export default function PlaylistScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: detail } = useFestivalDetail(slug);
  const { data: spotifyStatus } = useSpotifyStatus();
  const { connect, ready } = useSpotifyConnect();
  const generate = useGeneratePlaylist();

  const [result, setResult] = useState<PlaylistResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Latest edition drives the lineup (editions are sorted year desc).
  const edition = detail?.editions[0];

  const run = async () => {
    if (!detail || !edition) return;
    setError(null);
    try {
      setResult(await generate.mutateAsync({ festival_id: detail.festival.id, edition_id: edition.id }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>{t('festival.generatePlaylist')}</Text>
      <Text style={styles.subtitle}>
        {detail ? `${detail.festival.name}${edition ? ` · ${edition.year}` : ''}` : '…'}
      </Text>

      {/* Connection status */}
      <View style={styles.statusCard}>
        <Ionicons
          name="musical-notes"
          size={18}
          color={spotifyStatus ? colors.spotify : colors.textMuted}
        />
        <Text style={[styles.statusText, spotifyStatus && { color: colors.spotify }]}>
          {spotifyStatus ? t('profile.spotifyConnected') : t('spotify.connectPrompt')}
        </Text>
      </View>
      {!spotifyStatus && (
        <Button
          label={t('profile.connectSpotify')}
          variant="secondary"
          onPress={() => void connect().catch((e) => setError(String(e)))}
          disabled={!ready}
        />
      )}

      {/* Generate */}
      {generate.isPending ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>{t('spotify.generating')}</Text>
        </View>
      ) : (
        <Button
          label={result ? t('common.retry') : t('festival.generatePlaylist')}
          onPress={() => void run()}
          disabled={!edition}
        />
      )}
      {!edition && detail && <Text style={styles.error}>{t('empty.noResults')}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      {/* Summary */}
      {result && (
        <>
          <View style={styles.summaryGrid}>
            <Summary value={result.total_artists} label={t('spotify.artistsFound')} />
            <Summary value={result.matched_artists} label={t('spotify.artistsMatched')} />
            <Summary value={result.total_tracks} label={t('spotify.tracksAdded')} />
            <Summary value={result.skipped.length} label={t('spotify.skippedArtists')} />
          </View>

          {result.playlist_url ? (
            <Button
              label={t('spotify.openInSpotify')}
              onPress={() => void Linking.openURL(result.playlist_url!)}
              style={{ backgroundColor: colors.spotify }}
            />
          ) : (
            <Text style={styles.previewTitle}>{t('spotify.previewPlaylist')}</Text>
          )}

          <View style={styles.trackList}>
            {result.tracks.map((track, index) => (
              <View key={index} style={styles.trackRow}>
                <Text style={styles.trackIndex}>{index + 1}</Text>
                <View style={styles.trackBody}>
                  <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                </View>
              </View>
            ))}
          </View>

          {result.skipped.length > 0 && (
            <Text style={styles.skipped}>
              {t('spotify.skippedArtists')}: {result.skipped.join(', ')}
            </Text>
          )}
        </>
      )}

      <Button label={t('common.done')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function Summary({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
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
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statusText: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  loading: { alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl },
  loadingText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  error: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.danger,
    marginTop: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  summaryBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  summaryValue: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  summaryLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  previewTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  trackList: { gap: spacing.sm, marginVertical: spacing.lg },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  trackIndex: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    width: 22,
    textAlign: 'right',
  },
  trackBody: { flex: 1 },
  trackName: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  trackArtist: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  skipped: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
});
