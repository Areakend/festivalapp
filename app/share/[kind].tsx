import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { Button } from '@/components/ui/Button';
import { StoryCard } from '@/components/share/StoryCard';
import {
  useEditionLineup,
  useFestivalDetail,
  useFestivals,
  useMyAttendances,
  useMyStatuses,
  type CatalogItem,
} from '@/features/festivals/api';
import { useFriendsFestivalAttendance } from '@/features/friends/api';
import { useMyReviews } from '@/features/reviews/api';
import { colors, spacing, typography } from '@/theme';

const DAY_MS = 24 * 60 * 60 * 1000;

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

  const next = useNextFestival();
  const last = useLastFestival();

  const festivalId = kind === 'next' ? next?.item.festival.id : last?.item.festival.id;
  const { data: detail } = useFestivalDetail(
    (kind === 'next' ? next?.item.festival.slug : last?.item.festival.slug) ?? '',
  );
  const lineupEdition =
    kind === 'next'
      ? detail?.editions.find((e) => e.lineup_published)
      : detail?.editions.find((e) => e.lineup_published && e.year === last?.year);
  const { data: lineup } = useEditionLineup(lineupEdition?.id);
  const topArtists = (lineup ?? []).slice(0, 5).map((e) => e.artists.name);

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

  const data = kind === 'next' ? next : last;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Pressable style={styles.back} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={styles.title}>
        {kind === 'next' ? t('share.nextTitle') : t('share.lastTitle')}
      </Text>

      <View style={styles.preview}>
        {!festivalId ? (
          <Text style={styles.empty}>
            {kind === 'next' ? t('share.noNext') : t('share.noLast')}
          </Text>
        ) : kind === 'next' && next ? (
          <StoryCard
            ref={cardRef}
            kind="next"
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
            festivalName={last.item.festival.name}
            city={last.item.festival.city}
            country={last.item.festival.country}
            year={last.year}
            rating={last.rating}
            crewNames={last.crewNames}
            topArtists={topArtists}
          />
        ) : null}
      </View>

      {festivalId && (
        <Button
          label={t('share.share')}
          onPress={() => void share()}
          loading={sharing}
          style={styles.shareButton}
        />
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
    marginBottom: spacing.xl,
  },
  preview: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  empty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  shareButton: { marginBottom: spacing.xl },
});
