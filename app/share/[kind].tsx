import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import {
  CARD_THEMES,
  StoryCard,
  type CardAlign,
  type CardBackground,
  type CardTheme,
} from '@/components/share/StoryCard';
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
import { countryFlag } from '@/utils/format';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CARD_ARTISTS = 5;

/** Every hideable block on the card. */
type ToggleKey = 'location' | 'date' | 'rating' | 'counter' | 'year' | 'artists' | 'friends' | 'footer';

const TOGGLES_BY_KIND: Record<'next' | 'last', ToggleKey[]> = {
  next: ['date', 'location', 'artists', 'friends', 'footer'],
  last: ['rating', 'counter', 'year', 'location', 'artists', 'friends', 'footer'],
};

const TOGGLE_LABEL_KEYS: Record<ToggleKey, string> = {
  location: 'share.toggle.location',
  date: 'share.toggle.date',
  rating: 'share.toggle.rating',
  counter: 'share.toggle.counter',
  year: 'share.toggle.year',
  artists: 'share.toggle.artists',
  friends: 'share.toggle.friends',
  footer: 'share.toggle.footer',
};

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
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);

  const [theme, setTheme] = useState<CardTheme>('violet');
  const [bgMode, setBgMode] = useState<'gradient' | 'photo' | 'transparent'>('gradient');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [align, setAlign] = useState<CardAlign>('left');
  const [hidden, setHidden] = useState<Set<ToggleKey>>(new Set());
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

  const toggle = (key: ToggleKey) => {
    setHidden((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(key)) nextSet.delete(key);
      else nextSet.add(key);
      return nextSet;
    });
  };
  const show = (key: ToggleKey) => !hidden.has(key);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    setPhotoUri(result.assets[0].uri);
    setBgMode('photo');
  };

  const capture = () => captureRef(cardRef, { format: 'png', quality: 1 });

  const share = async () => {
    if (!cardRef.current) return;
    setBusy('share');
    try {
      const uri = await capture();
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(t('common.error'), t('share.unavailable'));
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('share.title') });
    } catch (error) {
      Alert.alert(t('common.error'), (error as Error).message);
    } finally {
      setBusy(null);
    }
  };

  // Strava-style: save the PNG (transparent background included) straight
  // to the gallery so the user can layer it over their own story.
  const download = async () => {
    if (!cardRef.current) return;
    setBusy('save');
    try {
      const { granted } = await MediaLibrary.requestPermissionsAsync(true);
      if (!granted) {
        Alert.alert(t('common.error'), t('share.saveDenied'));
        return;
      }
      const uri = await capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert(t('share.title'), t('share.saved'));
    } catch (error) {
      Alert.alert(t('common.error'), (error as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  const background: CardBackground =
    bgMode === 'photo' && photoUri
      ? { mode: 'photo', uri: photoUri }
      : bgMode === 'transparent'
        ? { mode: 'transparent' }
        : { mode: 'gradient', theme };

  const item = kind === 'next' ? next?.item : last?.item;
  const metaLine =
    item && show('location')
      ? `${countryFlag(item.festival.country)} ${[item.festival.city, item.festival.country]
          .filter(Boolean)
          .join(', ')}`
      : null;

  const yearCount =
    kind === 'last' && last
      ? (myAttendances ?? []).filter((a) => a.attended_year === last.year).length
      : 0;

  const toggles = TOGGLES_BY_KIND[kind === 'next' ? 'next' : 'last'];

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
                  background={background}
                  align={align}
                  festivalName={next.item.festival.name}
                  metaLine={metaLine}
                  daysUntil={next.daysUntil}
                  happeningNow={next.happeningNow}
                  dateLabel={
                    show('date') && next.item.nextEdition
                      ? `${formatDate(next.item.nextEdition.start_date)}${
                          next.item.nextEdition.end_date
                            ? ` – ${formatDate(next.item.nextEdition.end_date)}`
                            : ''
                        }`
                      : null
                  }
                  friendNames={show('friends') ? next.friendNames : []}
                  topArtists={show('artists') ? topArtists : []}
                  showFooter={show('footer')}
                />
              ) : kind === 'last' && last ? (
                <StoryCard
                  ref={cardRef}
                  kind="last"
                  background={background}
                  align={align}
                  festivalName={last.item.festival.name}
                  metaLine={metaLine}
                  year={last.year}
                  showYear={show('year')}
                  rating={show('rating') ? last.rating : null}
                  yearCount={show('counter') && yearCount > 0 ? yearCount : null}
                  friendNames={show('friends') ? last.crewNames : []}
                  topArtists={show('artists') ? topArtists : []}
                  showFooter={show('footer')}
                />
              ) : null}
            </View>

            {/* Background: gradients, own photo, or transparent (sticker) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('share.background')}</Text>
              <View style={styles.themeRow}>
                {(Object.keys(CARD_THEMES) as CardTheme[]).map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => {
                      setTheme(key);
                      setBgMode('gradient');
                    }}
                    style={[
                      styles.themeDot,
                      { backgroundColor: CARD_THEMES[key][0] },
                      bgMode === 'gradient' && theme === key && styles.themeDotActive,
                    ]}
                  />
                ))}
                <Pressable
                  onPress={() => void pickPhoto()}
                  style={[styles.themeDot, styles.themeDotIcon, bgMode === 'photo' && styles.themeDotActive]}
                >
                  <Ionicons name="image-outline" size={16} color={colors.text} />
                </Pressable>
                <Pressable
                  onPress={() => setBgMode('transparent')}
                  style={[
                    styles.themeDot,
                    styles.themeDotIcon,
                    bgMode === 'transparent' && styles.themeDotActive,
                  ]}
                >
                  <MaterialIcons name="blur-off" size={16} color={colors.text} />
                </Pressable>
              </View>
              {bgMode === 'transparent' && (
                <Text style={styles.hint}>{t('share.transparentHint')}</Text>
              )}
            </View>

            {/* Text alignment */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('share.align')}</Text>
              <View style={styles.themeRow}>
                {(['left', 'center', 'right'] as CardAlign[]).map((a) => (
                  <Pressable
                    key={a}
                    onPress={() => setAlign(a)}
                    style={[styles.themeDot, styles.themeDotIcon, align === a && styles.themeDotActive]}
                  >
                    <MaterialIcons
                      name={`format-align-${a}` as never}
                      size={16}
                      color={colors.text}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Which info blocks show on the card */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('share.infoShown')}</Text>
              <View style={styles.toggleRow}>
                {toggles.map((key) => (
                  <Chip
                    key={key}
                    label={t(TOGGLE_LABEL_KEYS[key])}
                    active={show(key)}
                    onPress={() => toggle(key)}
                  />
                ))}
              </View>
            </View>

            {/* Which artists show on the card (max 5) */}
            {show('artists') && sortedLineup.length > 0 && (
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

          <View style={styles.actions}>
            <Button
              label={t('share.download')}
              variant="secondary"
              onPress={() => void download()}
              loading={busy === 'save'}
              style={styles.actionButton}
            />
            <Button
              label={t('share.share')}
              onPress={() => void share()}
              loading={busy === 'share'}
              style={styles.actionButton}
            />
          </View>
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
  hint: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  themeRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  themeDot: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeDotIcon: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  themeDotActive: { borderColor: colors.text },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipRow: { gap: spacing.sm, paddingRight: spacing.xl },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  actionButton: { flex: 1 },
});
