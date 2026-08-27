import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  useMyFollowedArtistProfiles,
  useSearchArtists,
  useToggleArtistFollow,
  type ArtistProfile,
} from '@/features/artists/api';
import { colors, radii, spacing, typography } from '@/theme';

/** Followed artists + search-and-follow — the entry point for the
 *  per-artist festival history screen. */
export default function ArtistsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const { data: followed } = useMyFollowedArtistProfiles();
  const { data: searchResults } = useSearchArtists(search);
  const toggleFollow = useToggleArtistFollow();
  const followedIds = new Set((followed ?? []).map((a) => a.id));

  const openArtist = (id: string) => router.push({ pathname: '/artist/[id]', params: { id } });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('artists.title')}</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder={t('artists.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <Pressable style={styles.searchClear} onPress={() => setSearch('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {search.trim().length >= 2 && (
        <View style={styles.section}>
          {(searchResults ?? []).length === 0 ? (
            <Text style={styles.empty}>{t('artists.noResults')}</Text>
          ) : (
            <View style={styles.card}>
              {searchResults!.map((artist) => (
                <ArtistRow
                  key={artist.id}
                  artist={artist}
                  following={followedIds.has(artist.id)}
                  onPress={() => openArtist(artist.id)}
                  onToggleFollow={() =>
                    toggleFollow.mutate({ artistId: artist.id, following: followedIds.has(artist.id) })
                  }
                />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('artists.followed')}</Text>
        {(followed ?? []).length === 0 ? (
          <Text style={styles.empty}>{t('artists.noneFollowed')}</Text>
        ) : (
          <View style={styles.card}>
            {followed!.map((artist) => (
              <ArtistRow
                key={artist.id}
                artist={artist}
                following
                onPress={() => openArtist(artist.id)}
                onToggleFollow={() => toggleFollow.mutate({ artistId: artist.id, following: true })}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ArtistRow({
  artist,
  following,
  onPress,
  onToggleFollow,
}: {
  artist: ArtistProfile;
  following: boolean;
  onPress: () => void;
  onToggleFollow: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowBody}>
        <Text style={styles.artistName} numberOfLines={1}>
          {artist.name}
        </Text>
        {artist.genres.length > 0 && (
          <Text style={styles.genres} numberOfLines={1}>
            {artist.genres.join(' · ')}
          </Text>
        )}
      </View>
      <Pressable
        style={[styles.followButton, following && styles.followButtonActive]}
        onPress={(e) => {
          e.stopPropagation();
          onToggleFollow();
        }}
        hitSlop={8}
      >
        <Text style={[styles.followLabel, following && styles.followLabelActive]}>
          {t(following ? 'artists.following' : 'artists.follow')}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  searchWrap: { marginHorizontal: spacing.xl, marginBottom: spacing.lg },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingRight: spacing.xxl,
    color: colors.text,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
  },
  searchClear: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  section: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  sectionTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  empty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  card: {
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
  artistName: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  genres: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
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
});
