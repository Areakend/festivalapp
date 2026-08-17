import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useMemo, useState } from 'react';

import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { RatingBar } from '@/components/ui/RatingBar';
import { AttendanceYearSheet } from '@/components/ui/AttendanceYearSheet';
import { CalendarDaysSheet, eachDay } from '@/components/ui/CalendarDaysSheet';
import { CalendarPickerSheet } from '@/components/ui/CalendarPickerSheet';
import { ReviewCard } from '@/components/review/ReviewCard';
import {
  useAddAttendance,
  useEditionLineup,
  useFestivalDetail,
  useMyAttendances,
  useMyStatuses,
  useRemoveAttendance,
  useToggleStatus,
} from '@/features/festivals/api';
import {
  REVIEW_SUMMARY_CATEGORIES,
  useFestivalReviews,
  useReviewSummary,
  type ReviewSort,
  type ReviewSummaryCategory,
} from '@/features/reviews/api';
import { useMyFollowedArtists, useToggleArtistFollow } from '@/features/artists/api';
import { useFriendsFestivalAttendance, type PublicProfile } from '@/features/friends/api';
import { InviteFriendsSheet } from '@/components/festival/InviteFriendsSheet';
import { useMyBlockedIds } from '@/features/moderation/api';
import { useSessionStore } from '@/features/auth/session-store';
import {
  exportEventsToCalendar,
  getPreferredCalendarId,
  getWritableCalendars,
  requestCalendarPermission,
  setPreferredCalendarId,
  type CalendarEvent,
  type WritableCalendar,
} from '@/lib/calendar';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag, countryName, formatCompact } from '@/utils/format';
import type { FestivalStatus } from '@/types/domain';

const STATUS_CONFIG: { status: FestivalStatus; icon: string; color: string; labelKey: string }[] = [
  { status: 'attended', icon: 'checkmark-circle', color: colors.statusAttended, labelKey: 'festival.attended' },
  { status: 'planned', icon: 'calendar', color: colors.statusPlanned, labelKey: 'festival.planned' },
  { status: 'wishlist', icon: 'heart', color: colors.statusWishlist, labelKey: 'festival.wishlist' },
  { status: 'favorite', icon: 'star', color: colors.statusFavorite, labelKey: 'festival.favorite' },
];

const CATEGORY_ICONS: Record<ReviewSummaryCategory, string> = {
  atmosphere: 'flame-outline',
  stages: 'musical-notes-outline',
  lodging: 'bed-outline',
  transport: 'bus-outline',
  tips: 'bulb-outline',
  organization: 'shield-checkmark-outline',
};

const LINEUP_PREVIEW_COUNT = 10;

export default function FestivalDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reviewSort, setReviewSort] = useState<ReviewSort>('newest');
  const { data, isLoading } = useFestivalDetail(slug);
  const { data: myStatuses } = useMyStatuses();
  const { data: allReviews } = useFestivalReviews(data?.festival.id, reviewSort);
  const { data: blockedIds } = useMyBlockedIds();
  // Blocked users' reviews disappear everywhere on this screen (list,
  // averages, AI-summary trigger) — the point of blocking someone.
  const reviews = useMemo(
    () =>
      blockedIds && blockedIds.size > 0
        ? (allReviews ?? []).filter((r) => !blockedIds.has(r.user_id))
        : allReviews,
    [allReviews, blockedIds],
  );
  const userId = useSessionStore((s) => s.session?.user.id);
  const hasMyReview = (reviews ?? []).some((r) => r.user_id === userId);
  const toggleStatus = useToggleStatus();
  const { data: myAttendances } = useMyAttendances();
  const addAttendance = useAddAttendance();
  const removeAttendance = useRemoveAttendance();
  const [yearSheetOpen, setYearSheetOpen] = useState(false);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [calendarSheetOpen, setCalendarSheetOpen] = useState(false);
  const [calendarExporting, setCalendarExporting] = useState(false);
  const [calendarPickerOpen, setCalendarPickerOpen] = useState(false);
  const [writableCalendars, setWritableCalendars] = useState<WritableCalendar[]>([]);
  const [pendingCalendarEvents, setPendingCalendarEvents] = useState<CalendarEvent[]>([]);
  const [lineupExpanded, setLineupExpanded] = useState(false);
  const { data: followedArtistIds } = useMyFollowedArtists();
  const toggleArtistFollow = useToggleArtistFollow();
  const { data: friendsAttendance } = useFriendsFestivalAttendance();

  const lineupEdition = data?.editions.find((e) => e.lineup_published);
  const { data: lineup } = useEditionLineup(lineupEdition?.id);
  // Followed artists first (so they always land inside the 10-artist
  // preview instead of being buried past it), each group keeping its
  // original order_index — not alphabetical, headliner order still wins
  // within "followed" and within "the rest".
  const sortedLineup = useMemo(() => {
    if (!lineup) return lineup;
    if (!followedArtistIds || followedArtistIds.size === 0) return lineup;
    return [...lineup].sort((a, b) => {
      const aFollowed = followedArtistIds.has(a.artists.id) ? 0 : 1;
      const bFollowed = followedArtistIds.has(b.artists.id) ? 0 : 1;
      return aFollowed - bFollowed || a.order_index - b.order_index;
    });
  }, [lineup, followedArtistIds]);
  const { data: aiSummary } = useReviewSummary(
    data?.festival.id,
    i18n.language,
    reviews?.length ?? 0,
  );

  // Average of each sub-rating across all community reviews (only rated ones).
  const subAverages = useMemo(() => {
    const defs = [
      { key: 'lineup_rating', label: t('review.lineupRating') },
      { key: 'production_rating', label: t('review.productionRating') },
      { key: 'side_quest_rating', label: t('review.sideQuestRating') },
      { key: 'organization_rating', label: t('review.organizationRating') },
      { key: 'atmosphere_rating', label: t('review.atmosphereRating') },
      { key: 'value_rating', label: t('review.valueRating') },
    ] as const;
    return defs
      .map(({ key, label }) => {
        const values = (reviews ?? [])
          .map((r) => r[key])
          .filter((v): v is number => v != null);
        return {
          key,
          label,
          value: values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0,
        };
      })
      .filter((entry) => entry.value > 0);
  }, [reviews, t]);

  if (isLoading || !data) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const { festival, editions, rankings, stats } = data;
  const today = new Date().toISOString().slice(0, 10);
  // Soonest edition still upcoming (undefined if none) — the one "add to
  // calendar" exports, and what decides the share button's "next" vs
  // "last" kind. Genuinely absent, not defaulted, unlike nextEdition below.
  const upcomingEdition = [...editions]
    .filter((e) => e.start_date && e.start_date >= today)
    .sort((a, b) => a.start_date!.localeCompare(b.start_date!))[0];
  // For display: same soonest-upcoming pick, but falls back to the most
  // recent past one (editions come back sorted year desc, so the first
  // dated row is it) so a past-only festival still shows *a* date.
  const nextEdition = upcomingEdition ?? editions.find((e) => e.start_date) ?? null;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });
  const activeStatuses = new Set(
    (myStatuses ?? [])
      .filter((s) => s.festival_id === festival.id)
      .map((s) => s.status),
  );
  const festivalAttendances = (myAttendances ?? [])
    .filter((a) => a.festival_id === festival.id)
    .sort((a, b) => b.attended_year - a.attended_year);

  const calendarLocation = [festival.venue, festival.city, countryName(festival.country, i18n.language)]
    .filter(Boolean)
    .join(', ');
  const calendarDays = upcomingEdition
    ? eachDay(upcomingEdition.start_date!, upcomingEdition.end_date ?? upcomingEdition.start_date!)
    : [];

  const doExportEvents = async (events: CalendarEvent[], calendarId?: string) => {
    setCalendarExporting(true);
    try {
      await exportEventsToCalendar(events, calendarId);
    } catch (error) {
      const deniedPermission = error instanceof Error && error.message === 'Calendar permission denied';
      Alert.alert(
        t('common.error'),
        deniedPermission
          ? t('festival.calendarPermissionDenied')
          : error instanceof Error
            ? error.message
            : String(error),
      );
    } finally {
      setCalendarExporting(false);
      setCalendarSheetOpen(false);
    }
  };

  const exportToCalendar = async (dates: string[]) => {
    if (!upcomingEdition || dates.length === 0) return;
    const events: CalendarEvent[] = dates.map((date) => ({
      title:
        calendarDays.length > 1
          ? `${festival.name} — ${t('festival.dayNumber', { count: calendarDays.indexOf(date) + 1 })}`
          : festival.name,
      startDate: date,
      location: calendarLocation || undefined,
      description: festival.official_website ?? undefined,
    }));

    // Android has no single OS-level default calendar the way iOS does —
    // silently picking the first writable one found isn't reliable (it can
    // land in a manufacturer's own local calendar instead of e.g. Google).
    // Ask once, remember the choice, skip this entirely from then on.
    if (Platform.OS === 'android' && !(await getPreferredCalendarId())) {
      setCalendarExporting(true);
      const permitted = await requestCalendarPermission();
      const calendars = permitted ? await getWritableCalendars() : [];
      setCalendarExporting(false);
      if (calendars.length > 1) {
        setWritableCalendars(calendars);
        setPendingCalendarEvents(events);
        setCalendarPickerOpen(true);
        return;
      }
    }

    await doExportEvents(events);
  };

  const onCalendarPicked = (calendar: WritableCalendar) => {
    setCalendarPickerOpen(false);
    void setPreferredCalendarId(calendar.id);
    void doExportEvents(pendingCalendarEvents, calendar.id);
  };

  const handleAddToCalendarPress = () => {
    if (calendarDays.length > 1) {
      setCalendarSheetOpen(true);
    } else {
      void exportToCalendar(calendarDays);
    }
  };

  // Always shown, regardless of whether this festival has an upcoming
  // edition or a logged attendance — the share screen itself already
  // handles having neither (share.noNext / share.noLast), so there's no
  // broken state to gate against here.
  const handleSharePress = () => {
    router.push({
      pathname: '/share/[kind]',
      params: { kind: upcomingEdition ? 'next' : 'last', festivalId: festival.id },
    });
  };

  // Most recent edition that's already finished — used below to catch
  // "planned" friends whose status is stale (see friendsHere).
  const latestPastEdition = [...editions]
    .filter((e) => e.start_date && e.start_date < today)
    .sort((a, b) => b.start_date!.localeCompare(a.start_date!))[0];

  // Friends going (planned) or who went (attended) — attended wins if a
  // friend somehow has both rows for this festival. A "planned" status only
  // auto-advances to "attended" on the OWNING user's own client (see
  // useAutoAdvancePlannedFestivals) — it never updates just because someone
  // else views this page. So a friend who planned an edition that has since
  // finished, and hasn't reopened the app since, would otherwise show here
  // as "going" to whatever the festival's next edition happens to be now
  // (e.g. next year's, once its dates exist) — skip them instead, the same
  // staleness check the owning user's own client would apply.
  const friendsHere = (() => {
    const byProfile = new Map<string, { profile: PublicProfile; status: 'planned' | 'attended' }>();
    for (const row of friendsAttendance ?? []) {
      if (row.festival_id !== festival.id) continue;
      if (
        row.status === 'planned' &&
        latestPastEdition &&
        row.createdAt < (latestPastEdition.end_date ?? latestPastEdition.start_date!)
      ) {
        continue;
      }
      const existing = byProfile.get(row.profile.id);
      if (!existing || row.status === 'attended') {
        byProfile.set(row.profile.id, { profile: row.profile, status: row.status });
      }
    }
    return [...byProfile.values()];
  })();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
    >
      {/* Header / cover */}
      <View style={styles.cover}>
        {festival.cover_image_url ? (
          <Image
            source={{ uri: festival.cover_image_url }}
            style={StyleSheet.absoluteFill}
            // Generated covers (assets/generated-covers) are square
            // gradient+typography graphics with the festival name baked
            // in — cropping them to this wide, short header with
            // contentFit="cover" slices right through the text. Real
            // Commons photos have no such constraint, so only the
            // generated ones need the no-crop "contain" treatment.
            contentFit={festival.cover_image_url.includes('/generated-covers/') ? 'contain' : 'cover'}
            transition={150}
          />
        ) : (
          <Text style={styles.coverLetter}>{festival.name.charAt(0)}</Text>
        )}
        <Pressable style={styles.coverShare} onPress={handleSharePress} hitSlop={10}>
          <Ionicons name="share-social-outline" size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>{festival.name}</Text>
        <Text style={styles.location}>
          {countryFlag(festival.country)} {[festival.city, festival.venue].filter(Boolean).join(' · ')}
        </Text>
        {nextEdition?.start_date && (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              {formatDate(nextEdition.start_date)}
              {nextEdition.end_date ? ` – ${formatDate(nextEdition.end_date)}` : ''}
            </Text>
          </View>
        )}
        {festival.official_website && (
          <Pressable
            style={styles.websiteRow}
            onPress={() => Linking.openURL(festival.official_website!)}
            hitSlop={8}
          >
            <Ionicons name="globe-outline" size={15} color={colors.primary} />
            <Text style={styles.websiteText}>{t('festival.website')}</Text>
          </Pressable>
        )}

        <View style={styles.genreRow}>
          {festival.genres.map((g) => (
            <Chip key={g} label={g} />
          ))}
        </View>

        {/* Tracking actions */}
        <View style={styles.statusRow}>
          {STATUS_CONFIG.map(({ status, icon, color, labelKey }) => {
            const active = activeStatuses.has(status);
            return (
              <Pressable
                key={status}
                style={[styles.statusButton, active && { borderColor: color, backgroundColor: `${color}1A` }]}
                onPress={() =>
                  toggleStatus.mutate({ festivalId: festival.id, status, active })
                }
              >
                <Ionicons
                  name={(active ? icon : `${icon}-outline`) as never}
                  size={22}
                  color={active ? color : colors.textSecondary}
                />
                <Text style={[styles.statusLabel, active && { color }]}>{t(labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Invite friends to this specific upcoming/latest edition — needs a
            dated edition to attach the invite to, so hidden otherwise. */}
        {nextEdition && (
          <Pressable style={styles.inviteRow} onPress={() => setInviteSheetOpen(true)} hitSlop={8}>
            <Ionicons name="people-outline" size={16} color={colors.primary} />
            <Text style={styles.inviteRowText}>{t('invites.inviteFriends')}</Text>
          </Pressable>
        )}
        {nextEdition && (
          <InviteFriendsSheet
            visible={inviteSheetOpen}
            festivalId={festival.id}
            editionId={nextEdition.id}
            onClose={() => setInviteSheetOpen(false)}
          />
        )}

        {upcomingEdition && (
          <>
            <Button
              label={t('festival.addToCalendar')}
              variant="secondary"
              onPress={handleAddToCalendarPress}
              loading={calendarExporting}
            />
            <CalendarDaysSheet
              visible={calendarSheetOpen}
              startDate={upcomingEdition.start_date!}
              endDate={upcomingEdition.end_date ?? upcomingEdition.start_date!}
              locale={i18n.language}
              onExport={(dates) => void exportToCalendar(dates)}
              onClose={() => setCalendarSheetOpen(false)}
            />
            <CalendarPickerSheet
              visible={calendarPickerOpen}
              calendars={writableCalendars}
              onSelect={onCalendarPicked}
              onClose={() => setCalendarPickerOpen(false)}
            />
          </>
        )}

        {/* Packing checklist — only meaningful once you're actually going. */}
        {activeStatuses.has('planned') && (
          <Button
            label={t('checklist.entryPoint')}
            variant="secondary"
            onPress={() => router.push({ pathname: '/checklist/[slug]', params: { slug } })}
          />
        )}

        {/* Detailed per-year attendance log (supplements the quick "attended" status above) */}
        <View style={styles.attendanceRow}>
          <Text style={styles.attendanceLabel}>{t('festival.attendedYears')}</Text>
          <View style={styles.attendanceChips}>
            {festivalAttendances.map((a) => (
              <Chip
                key={a.id}
                label={String(a.attended_year)}
                active
                activeColor={colors.statusAttended}
                onPress={() => removeAttendance.mutate(a.id)}
              />
            ))}
            <Chip label={`+ ${t('festival.addYear')}`} onPress={() => setYearSheetOpen(true)} />
          </View>
        </View>

        <AttendanceYearSheet
          visible={yearSheetOpen}
          recordedYears={festivalAttendances.map((a) => a.attended_year)}
          fromYear={festival.first_year ?? new Date().getFullYear() - 30}
          onSelect={(year) => addAttendance.mutate({ festivalId: festival.id, year })}
          onDeselect={(year) => {
            const match = festivalAttendances.find((a) => a.attended_year === year);
            if (match) removeAttendance.mutate(match.id);
          }}
          onClose={() => setYearSheetOpen(false)}
        />

        {/* Friends going or who went */}
        {friendsHere.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('festival.friendsHere')}</Text>
            <View style={styles.friendsList}>
              {friendsHere.map(({ profile, status }) => (
                <Pressable
                  key={profile.id}
                  style={({ pressed }) => [styles.friendRow, pressed && { opacity: 0.7 }]}
                  onPress={() => router.push({ pathname: '/user/[id]', params: { id: profile.id } })}
                >
                  <Ionicons
                    name={status === 'attended' ? 'checkmark-circle' : 'calendar'}
                    size={18}
                    color={status === 'attended' ? colors.statusAttended : colors.statusPlanned}
                  />
                  <Text style={styles.friendName} numberOfLines={1}>
                    {profile.display_name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Stats */}
        <Text style={styles.sectionTitle}>{t('festival.stats')}</Text>
        <View style={styles.statsGrid}>
          <StatBox
            label={t('festival.communityRating')}
            value={stats && stats.rating_count > 0 ? `${stats.avg_rating.toFixed(1)}/20` : '–'}
            hint={stats ? t('festival.ratingsCount', { count: stats.rating_count }) : undefined}
          />
          <StatBox
            label={t('festival.bestRank')}
            value={festival.best_djmag_rank != null ? `#${festival.best_djmag_rank}` : '–'}
          />
          <StatBox label={t('festival.stages')} value={festival.number_of_stages?.toString() ?? '–'} />
          <StatBox
            label={t('festival.capacity')}
            value={festival.capacity != null ? formatCompact(festival.capacity, i18n.language) : '–'}
          />
        </View>

        {/* Rating breakdown — community averages per category */}
        {subAverages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('review.breakdown')}</Text>
            <View style={styles.breakdownCard}>
              {subAverages.map(({ key, label, value }) => (
                <RatingBar key={key} label={label} value={value} />
              ))}
            </View>
          </>
        )}

        {/* Description */}
        {festival.description && <Text style={styles.description}>{festival.description}</Text>}

        {/* Lineup of the most recent published edition — followed artists
            are highlighted; tapping any artist toggles following them
            in-app (no external account needed). */}
        {lineupEdition && lineup && lineup.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {t('festival.lineup')} · {lineupEdition.year}
            </Text>
            <View style={styles.lineupWrap}>
              {(lineupExpanded ? sortedLineup! : sortedLineup!.slice(0, LINEUP_PREVIEW_COUNT)).map((entry) => {
                const following = followedArtistIds?.has(entry.artists.id) ?? false;
                return (
                  <Chip
                    key={entry.artists.id}
                    label={entry.artists.name}
                    active={following}
                    activeColor={colors.primary}
                    onPress={() =>
                      toggleArtistFollow.mutate({ artistId: entry.artists.id, following })
                    }
                  />
                );
              })}
            </View>
            {lineup.length > LINEUP_PREVIEW_COUNT && (
              <Button
                label={
                  lineupExpanded
                    ? t('common.seeLess')
                    : t('festival.seeMoreArtists', { count: lineup.length - LINEUP_PREVIEW_COUNT })
                }
                variant="ghost"
                onPress={() => setLineupExpanded((v) => !v)}
              />
            )}
            <Button
              label={t('festival.generatePlaylist')}
              variant="secondary"
              onPress={() => router.push({ pathname: '/playlist/[slug]', params: { slug } })}
              style={styles.sectionAction}
            />
          </>
        )}

        {/* DJ Mag ranking history */}
        {rankings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('festival.rankingHistory')}</Text>
            <View style={styles.rankingList}>
              {rankings.map((r) => (
                <View key={r.id} style={styles.rankingRow}>
                  <Text style={styles.rankingYear}>{r.year}</Text>
                  <Text style={styles.rankingPos}>#{r.rank_position}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Reviews */}
        <Text style={styles.sectionTitle}>{t('festival.reviews')}</Text>

        {/* AI summary of community reviews, split by topic — a category only
            shows up if the model found real grounded content for it. */}
        {aiSummary && Object.keys(aiSummary.categories).length > 0 && (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={16} color={colors.accent} />
              <Text style={styles.aiTitle}>{t('review.aiSummary')}</Text>
            </View>
            {REVIEW_SUMMARY_CATEGORIES.filter((key) => aiSummary.categories[key]).map((key) => (
              <View key={key} style={styles.aiCategory}>
                <View style={styles.aiCategoryHeader}>
                  <Ionicons name={CATEGORY_ICONS[key] as never} size={14} color={colors.textSecondary} />
                  <Text style={styles.aiCategoryLabel}>{t(`review.category.${key}`)}</Text>
                </View>
                <Text style={styles.aiText}>{aiSummary.categories[key]}</Text>
              </View>
            ))}
            <Text style={styles.aiDisclaimer}>{t('review.aiDisclaimer')}</Text>
          </View>
        )}

        <Button
          label={hasMyReview ? t('review.editReview') : t('festival.rateReview')}
          onPress={() => router.push({ pathname: '/review/[slug]', params: { slug } })}
          style={styles.sectionAction}
        />

        <View style={styles.sortRow}>
          <Chip
            label={t('review.sortNewest')}
            active={reviewSort === 'newest'}
            onPress={() => setReviewSort('newest')}
          />
          <Chip
            label={t('review.sortHighest')}
            active={reviewSort === 'highest'}
            onPress={() => setReviewSort('highest')}
          />
        </View>
        {reviews && reviews.length > 0 ? (
          <View style={styles.reviewList}>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </View>
        ) : (
          <Text style={styles.noReviews}>{t('empty.noReviews')}</Text>
        )}
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    height: 200,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coverShare: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(11, 11, 20, 0.55)',
    borderRadius: radii.full,
    padding: spacing.sm,
  },
  coverLetter: {
    fontFamily: typography.fonts.heading,
    fontSize: 72,
    color: colors.primary,
  },
  body: { padding: spacing.xl, gap: spacing.md },
  name: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
  },
  location: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dateText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  websiteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  websiteText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  inviteRowText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  lineupWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  aiCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiTitle: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  aiCategory: { gap: 2 },
  aiCategoryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  aiCategoryLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  aiText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  aiDisclaimer: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statusButton: {
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    width: '23%',
  },
  statusLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  attendanceRow: { gap: spacing.sm, marginTop: spacing.md },
  attendanceLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  attendanceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  friendsList: { gap: spacing.xs },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  friendName: {
    flex: 1,
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
    marginTop: spacing.lg,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
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
  statHint: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  description: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  rankingList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
  },
  rankingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rankingYear: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  rankingPos: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.rating,
  },
  sectionAction: { marginTop: spacing.sm },
  sortRow: { flexDirection: 'row', gap: spacing.sm },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  reviewList: { gap: spacing.md },
  noReviews: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
