import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  useArtist,
  useArtistFestivals,
  useMyFollowedArtists,
  useToggleArtistFollow,
  type ArtistSeenFestival,
  type ArtistUpcomingFestival,
} from '@/features/artists/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: artist } = useArtist(id);
  const { data: history } = useArtistFestivals(id);
  const { data: followedIds } = useMyFollowedArtists();
  const toggleFollow = useToggleArtistFollow();
  const following = followedIds?.has(id) ?? false;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>

      {artist && (
        <View style={styles.titleRow}>
          <Text style={styles.name}>{artist.name}</Text>
          <Pressable
            style={[styles.followButton, following && styles.followButtonActive]}
            onPress={() => toggleFollow.mutate({ artistId: artist.id, following })}
          >
            <Text style={[styles.followLabel, following && styles.followLabelActive]}>
              {t(following ? 'artists.following' : 'artists.follow')}
            </Text>
          </Pressable>
        </View>
      )}
      {artist && artist.genres.length > 0 && (
        <Text style={styles.genres}>{artist.genres.join(' · ')}</Text>
      )}
      {!!history?.totalSeenCount && (
        <Text style={styles.totalSeen}>
          {t('artists.seenCount', { count: history.totalSeenCount })}
        </Text>
      )}

      <Text style={styles.sectionTitle}>{t('artists.upcoming')}</Text>
      {(history?.upcoming.length ?? 0) === 0 ? (
        <Text style={styles.empty}>{t('artists.noUpcoming')}</Text>
      ) : (
        <View style={styles.card}>
          {history!.upcoming.map((entry: ArtistUpcomingFestival) => (
            <Pressable
              key={`${entry.festivalId}-${entry.year}`}
              style={styles.row}
              onPress={() =>
                router.push({ pathname: '/festival/[slug]', params: { slug: entry.festivalSlug } })
              }
            >
              <View style={styles.rowBody}>
                <Text style={styles.festivalName} numberOfLines={1}>
                  {countryFlag(entry.country)} {entry.festivalName}
                </Text>
                {entry.startDate && (
                  <Text style={styles.meta} numberOfLines={1}>
                    {formatDate(entry.startDate)}
                    {entry.endDate ? ` – ${formatDate(entry.endDate)}` : ''}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>{t('artists.seen')}</Text>
      {(history?.seen.length ?? 0) === 0 ? (
        <Text style={styles.empty}>{t('artists.noneSeen')}</Text>
      ) : (
        <View style={styles.card}>
          {history!.seen.map((entry: ArtistSeenFestival) => (
            <Pressable
              key={entry.festivalId}
              style={styles.row}
              onPress={() =>
                router.push({ pathname: '/festival/[slug]', params: { slug: entry.festivalSlug } })
              }
            >
              <View style={styles.rowBody}>
                <Text style={styles.festivalName} numberOfLines={1}>
                  {countryFlag(entry.country)} {entry.festivalName}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {[...entry.years].sort((a, b) => b - a).join(', ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  headerSpacer: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  name: {
    flex: 1,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
  },
  genres: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  totalSeen: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.statusAttended,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  followButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  followButtonActive: {
    backgroundColor: `${colors.primary}26`,
    borderColor: colors.primary,
  },
  followLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  followLabelActive: { color: colors.primary },
  sectionTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  empty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    paddingHorizontal: spacing.xl,
  },
  card: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowBody: { flex: 1, gap: 2 },
  festivalName: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  meta: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
