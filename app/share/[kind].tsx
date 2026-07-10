import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { CARD_THEMES, StoryCard, type CardTheme } from '@/components/share/StoryCard';
import {
  useEditionLineup,
  useFestivalDetail,
  useFestivals,
  useMyAttendances,
  useMyStatuses,
  type CatalogItem,
} from '@/features/festivals/api';
import { useMyFollowedArtists } from '@/features/artists/api';
import { useFriendsFestivalAttendance } from '@/features/friends/api';
import { useMyReviews } from '@/features/reviews/api';
import { colors, radii, spacing, typography } from '@/theme';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CARD_ARTISTS = 5;

/** Which festival to build a story card for, and its lineup/social context. */
function useNextFestival() {
  const { data: catalog } = useFestivals();
  const { data: myStatuses } = useMyStatuses();
  const { data: friendsAttendance } = useFriendsFestivalAttendance();

  return useMemo(() => {
    const byId = new Map((catalog ?? []).map((item) => [item.festival.id, item]));
    const now = Date.now();
    const planned = (myStatuses ?? [])
      .filter((s) => s.status === 'planned')
      .map((s) => byId.get(s.festival_id))
      .filter((item): item is CatalogItem => item != null && item.nextEdition != null)
      .map((item) => {
        const start = new Date(item.nextEdition!.start_date).getTime();
        const end = item.nextEdition!.end_date
          ? new Date(item.nextEdition!.end_date).getTime() + DAY_MS
          : start + DAY_MS;
        return {
          item,
          daysUntil: Math.max(0, Math.ceil((start - now) / DAY_MS)),
          happeningNow: now >= start && now < end,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const next = planned[0];
    if (!next) return null;

    const friendNames = (friendsAttendance ?? [])
      .filter((r) => r.festival_id === next.item.festival.id)
      .map((r) => r.profile.display_name);

    return { ...next, friendNames: [...new Set(friendNames)] };
  }, [catalog, myStatuses, friendsAttendance]);
}

function useLastFestival() {
  const { data: catalog } = useFestivals();
  const { data: attendances } = useMyAttendances();
  const { data: myReviews } = useMyReviews();
  const { data: friendsAttendance } = useFriendsFestivalAttendance();

  return useMemo(() => {
    const byId = new Map((catalog ?? []).map((item) => [item.festival.id, item]));
    const last = [...(attendances ?? [])].sort((a, b) => b.attended_year - a.attended_year)[0];
    if (!last) return null;
    const item = byId.get(last.festival_id);
    if (!item) return null;

    const review = (myReviews ?? []).find(
      (r) => r.festival_id === last.festival_id && (r.year == null || r.year === last.attended_year),
    );
    const crewNames = (friendsAttendance ?? [])
      .filter((r) => r.festival_id === last.festival_id && r.status === 'attended')
      .map((r) => r.profile.display_name);

    return {
      item,
      year: last.attended_year,
      rating: review ? Number(review.overall_rating) : null,
      crewNames: [...new Set(crewNames)],
    };
  }, [catalog, attendances, myReviews, friendsAttendance]);
}

export default function ShareScreen() {
  const { kind } = useLocalSearchParams<{ kind: 'next' | 'last' }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [theme, setTheme] = useState<CardTheme>('violet');
  // null = user hasn't customized: the followed-first top 5 stays live.
  const [customArtistIds, setCustomArtistIds] = useState<string[] | null>(null);

  const next = useNextFestival();
  const last = useLastFestival();
  const { data: myAttendances } = useMyAttendances();

  const festivalId = kind === 'next' ? next?.item.festival.id : last?.item.festival.id;
  const { data: detail } = useFestivalDetail(
    (kind === 'next' ? next?.item.festival.slug : last?.item.festival.slug) ?? '',
  );
  const lineupEdition =
    kind === 'next'
      ? detail?.editions.find((e) => e.lineup_published)
      : detail?.editions.find((e) => e.lineup_published && e.year === last?.year);
  const { data: lineup } = useEditionLineup(lineupEdition?.id);
  const { data: followedArtistIds } = useMyFollowedArtists();

  // Followed artists first (headliner order within each group) so the
  // default card picks — and the front of the picker row — are the artists
  // the user actually cares about, not whoever is listed first.
  const sortedLineup = useMemo(() => {
    const entries = lineup ?? [];
    if (!followedArtistIds || followedArtistIds.size === 0) return entries;
    return [...entries].sort((a, b) => {
      const aFollowed = followedArtistIds.has(a.artists.id) ? 0 : 1;
      const bFollowed = followedArtistIds.has(b.artists.id) ? 0 : 1;
      return aFollowed - bFollowed || a.order_index - b.order_index;
    });
  }, [lineup, followedArtistIds]);

  const defaultArtistIds = useMemo(
    () => sortedLineup.slice(0, MAX_CARD_ARTISTS).map((e) => e.artists.id),
    [sortedLineup],
  );
  const selectedArtistIds = customArtistIds ?? defaultArtistIds;
  const selectedSet = useMemo(() => new Set(selectedArtistIds), [selectedArtistIds]);

  const toggleArtist = (artistId: string) => {
    const current = new Set(selectedArtistIds);
    if (current.has(artistId)) {
      current.delete(artistId);
    } else {
      if (current.size >= MAX_CARD_ARTISTS) return;
      current.add(artistId);
    }
    setCustomArtistIds([...current]);
  };

  // Card order follows the lineup order (not tap order) so the result
  // always reads like a poster.
  const topArtists = useMemo(
    () => sortedLineup.filter((e) => selectedSet.has(e.artists.id)).map((e) => e.artists.name),
    [sortedLineup, selectedSet],
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  const share = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(t('common.error'), t('share.unavailable'));
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('share.title') });
    } catch (error) {
      Alert.alert(t('common.error'), (error as Error).message);
    } finally {
      setSharing(false);
    }
  };

  const festivalCount = (myAttendances ?? []).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Pressable style={styles.back} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={styles.title}>
        {kind === 'next' ? t('share.nextTitle') : t('share.lastTitle')}
      </Text>

      {!festivalId ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {kind === 'next' ? t('share.noNext') : t('share.noLast')}
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cardWrap}>
              {kind === 'next' && next ? (
                <StoryCard
                  ref={cardRef}
                  kind="next"
                  theme={theme}
                  festivalName={next.item.festival.name}
                  city={next.item.festival.city}
                  country={next.item.festival.country}
                  daysUntil={next.daysUntil}
                  happeningNow={next.happeningNow}
                  dateLabel={
                    next.item.nextEdition
                      ? `${formatDate(next.item.nextEdition.start_date)}${
                          next.item.nextEdition.end_date
                            ? ` – ${formatDate(next.item.nextEdition.end_date)}`
                            : ''
                        }`
                      : ''
                  }
                  friendNames={next.friendNames}
                  topArtists={topArtists}
                />
              ) : kind === 'last' && last ? (
                <StoryCard
                  ref={cardRef}
                  kind="last"
                  theme={theme}
                  festivalName={last.item.festival.name}
                  city={last.item.festival.city}
                  country={last.item.festival.country}
                  year={last.year}
                  rating={last.rating}
                  festivalCount={festivalCount >= 2 ? festivalCount : null}
                  crewNames={last.crewNames}
                  topArtists={topArtists}
                />
              ) : null}
            </View>

            {/* Card color */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('share.pickTheme')}</Text>
              <View style={styles.themeRow}>
                {(Object.keys(CARD_THEMES) as CardTheme[]).map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => setTheme(key)}
                    style={[
                      styles.themeDot,
                      { backgroundColor: CARD_THEMES[key][0] },
                      theme === key && styles.themeDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Which artists show on the card (max 5) */}
            {sortedLineup.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {t('share.pickArtists')} · {selectedArtistIds.length}/{MAX_CARD_ARTISTS}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {sortedLineup.map((entry) => (
                    <Chip
                      key={entry.artists.id}
                      label={entry.artists.name}
                      active={selectedSet.has(entry.artists.id)}
                      onPress={() => toggleArtist(entry.artists.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          <Button
            label={t('share.share')}
            onPress={() => void share()}
            loading={sharing}
            style={styles.shareButton}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl },
  back: { marginBottom: spacing.md },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  scroll: { flex: 1 },
  scrollContent: { gap: spacing.lg, paddingBottom: spacing.lg },
  cardWrap: { alignItems: 'center' },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  themeRow: { flexDirection: 'row', gap: spacing.md },
  themeDot: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeDotActive: { borderColor: colors.text },
  chipRow: { gap: spacing.sm, paddingRight: spacing.xl },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  shareButton: { marginBottom: spacing.xl },
});
