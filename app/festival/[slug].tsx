import {
  ActivityIndicator,
  Alert,
  Linking,
  PanResponder,
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

import { useMemo, useRef, useState } from 'react';

import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { RatingBar } from '@/components/ui/RatingBar';
import { AttendanceYearSheet } from '@/components/ui/AttendanceYearSheet';
import { CalendarDaysSheet, eachDay } from '@/components/ui/CalendarDaysSheet';
import { CalendarPickerSheet } from '@/components/ui/CalendarPickerSheet';
import { InfoSheet } from '@/components/ui/InfoSheet';
import { MyReviewsSheet } from '@/components/festival/MyReviewsSheet';
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
import { useFestivalNavContext } from '@/features/festivals/nav-context';
import {
  REVIEW_SUMMARY_CATEGORIES,
  useFestivalReviews,
  useReviewSummary,
  type ReviewSort,
  type ReviewSummaryCategory,
} from '@/features/reviews/api';
import { useMyFollowedArtists, useToggleArtistFollow } from '@/features/artists/api';
import { useMyProfile, useUpdateProfile } from '@/features/profile/api';
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
import { openInMaps } from '@/utils/maps';
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

  // Set by the list screen this was opened from (wishlist/favorites/planned)
  // so a swipe can move to the next/previous festival in that same list —
  // empty (so no swipe) when opened any other way (search, an artist page,
  // a share link…). router.replace instead of push so swiping repeatedly
  // doesn't stack up history entries — "back" from here always exits to
  // the list, not back through every festival swiped past.
  const navSlugs = useFestivalNavContext((s) => s.slugs);
  const navIndex = slug ? navSlugs.indexOf(slug) : -1;
  const prevSlug = navIndex > 0 ? navSlugs[navIndex - 1] : null;
  const nextSlug = navIndex !== -1 && navIndex < navSlugs.length - 1 ? navSlugs[navIndex + 1] : null;
  // PanResponder is created once and never again (useRef), so its handlers
  // must read from a ref rather than close over prevSlug/nextSlug directly
  // — otherwise they'd keep seeing whatever those were on first render.
  const navRef = useRef({ prevSlug, nextSlug });
  navRef.current = { prevSlug, nextSlug };
  const swipeResponder = useRef(
    PanResponder.create({
      // A real swipe rarely tracks perfectly horizontal from the first
      // sampled move, so requiring dx to beat dy by 2x (and 20px minimum)
      // was missing genuine attempts to the ScrollView's own vertical
      // responder, which never gives the gesture back once it's claimed
      // it. Lower bar here, same 60px commit distance on release below.
      onMoveShouldSetPanResponderCapture: (_evt, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_evt, gesture) => {
        const { prevSlug: prev, nextSlug: next } = navRef.current;
        if (gesture.dx < -60 && next) {
          router.replace({ pathname: '/festival/[slug]', params: { slug: next } });
        } else if (gesture.dx > 60 && prev) {
          router.replace({ pathname: '/festival/[slug]', params: { slug: prev } });
        }
      },
    }),
  ).current;

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
  // One row per year reviewed (a festival can be reviewed again each time
  // it's attended) — most recent first, so the stats tile shows the
  // latest rating and tapping it lists every year underneath.
  const myFestivalReviews = useMemo(
    () =>
      (reviews ?? [])
        .filter((r) => r.user_id === userId)
        .sort((a, b) => (b.year ?? 0) - (a.year ?? 0)),
    [reviews, userId],
  );
  const [myReviewsOpen, setMyReviewsOpen] = useState(false);
  const [ratingInfoOpen, setRatingInfoOpen] = useState(false);
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
  const { data: myProfile } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const { data: friendsAttendance } = useFriendsFestivalAttendance();

  const toggleFavoriteGenre = (genre: string) => {
    const current = myProfile?.favorite_genres ?? [];
    const next = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre];
    updateProfile.mutate({ favorite_genres: next });
  };

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
  // Cancelled editions are excluded — they were scheduled but aren't
  // happening, so they shouldn't drive attendance tracking or calendar
  // export (see the cancelledEdition banner below instead).
  const upcomingEdition = [...editions]
    .filter((e) => e.start_date && e.start_date >= today && !e.cancelled)
    .sort((a, b) => a.start_date!.localeCompare(b.start_date!))[0];
  // For display: same soonest-upcoming pick, but falls back to the most
  // recent past one (editions come back sorted year desc, so the first
  // dated row is it) so a past-only festival still shows *a* date.
  const nextEdition = upcomingEdition ?? editions.find((e) => e.start_date && !e.cancelled) ?? null;
  // Only surfaced when there's no real upcoming edition to show instead —
  // an old cancellation shouldn't shadow a festival that's since come back.
  const cancelledEdition = !upcomingEdition ? editions.find((e) => e.cancelled) : undefined;
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
      const { added, skipped } = await exportEventsToCalendar(events, calendarId);
      if (skipped > 0) {
        Alert.alert(
          t('festival.calendarExported'),
          added > 0
            ? t('festival.calendarExportedSomeSkipped', { added, skipped })
            : t('festival.calendarExportedAllSkipped'),
        );
      }
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

    // Neither platform has a reliable single "the" calendar — silently
    // picking the first writable one found can land events in the wrong
    // account (a manufacturer's own local calendar on Android, or a work
    // Exchange/Google Workspace calendar on iOS if that's what Settings >
    // Calendar > Default happens to be set to). Ask once, remember the
    // choice, skip this entirely from then on.
    if (!(await getPreferredCalendarId())) {
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
  const { friendsGoing, friendsAttended } = (() => {
    const going = new Map<string, PublicProfile>();
    const attended = new Map<string, PublicProfile>();
    for (const row of friendsAttendance ?? []) {
      if (row.festival_id !== festival.id) continue;
      if (row.status === 'planned') {
        if (
          latestPastEdition &&
          row.createdAt < (latestPastEdition.end_date ?? latestPastEdition.start_date!)
        ) {
          continue;
        }
        going.set(row.profile.id, row.profile);
      } else {
        attended.set(row.profile.id, row.profile);
      }
    }
    return { friendsGoing: [...going.values()], friendsAttended: [...attended.values()] };
  })();

  return (
    <View style={styles.swipeArea} {...swipeResponder.panHandlers}>
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
            contentFit="cover"
            // Generated covers (assets/generated-covers) are square
            // gradient+typography graphics with the festival name baked in
            // at the bottom-left — anchoring the crop there instead of
            // centering it means widening/narrowing the header for
            // different screens only ever eats into the top-right empty
            // gradient, never the name. Real Commons photos have no such
            // constraint, so they keep the default centered crop.
            contentPosition={
              festival.cover_image_url.includes('/generated-covers/') ? 'bottom left' : 'center'
            }
            transition={150}
          />
        ) : (
          <Text style={styles.coverLetter}>{festival.name.charAt(0)}</Text>
        )}
        {navIndex !== -1 && (
          <View style={[styles.navPill, { top: insets.top + spacing.sm }]}>
            <Text style={styles.navPillText}>
              {navIndex + 1} / {navSlugs.length}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, styles.nameText]}>{festival.name}</Text>
          <Pressable style={styles.shareButton} onPress={handleSharePress} hitSlop={10}>
            <Ionicons name="share-social-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.location}>
            {countryFlag(festival.country)} {[festival.city, festival.venue].filter(Boolean).join(' · ')}
          </Text>
          {(festival.city || festival.venue) && (
            <Pressable onPress={() => openInMaps(festival, i18n.language)} hitSlop={10}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
            </Pressable>
          )}
        </View>
        {nextEdition?.start_date && (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              {formatDate(nextEdition.start_date)}
              {nextEdition.end_date ? ` – ${formatDate(nextEdition.end_date)}` : ''}
            </Text>
          </View>
        )}
        {cancelledEdition?.start_date && (
          <View style={styles.cancelledRow}>
            <Ionicons name="close-circle" size={15} color={colors.danger} />
            <Text style={styles.cancelledText}>
              {t('festival.editionCancelled', {
                date: formatDate(cancelledEdition.start_date),
              })}
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
            <Chip
              key={g}
              label={g}
              active={(myProfile?.favorite_genres ?? []).includes(g)}
              onPress={() => toggleFavoriteGenre(g)}
            />
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

        <InfoSheet
          visible={ratingInfoOpen}
          title={t('festival.communityRating')}
          body={t('festival.communityRatingExplainer')}
          onClose={() => setRatingInfoOpen(false)}
        />
        <MyReviewsSheet
          visible={myReviewsOpen}
          reviews={myFestivalReviews}
          onClose={() => setMyReviewsOpen(false)}
          onEdit={() => {
            setMyReviewsOpen(false);
            router.push({ pathname: '/review/[slug]', params: { slug } });
          }}
        />

        {/* Friends going */}
        {friendsGoing.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('festival.friendsGoing')}</Text>
            <View style={styles.friendsList}>
              {friendsGoing.map((profile) => (
                <Pressable
                  key={profile.id}
                  style={({ pressed }) => [styles.friendRow, pressed && { opacity: 0.7 }]}
                  onPress={() => router.push({ pathname: '/user/[id]', params: { id: profile.id } })}
                >
                  <Ionicons name="calendar" size={18} color={colors.statusPlanned} />
                  <Text style={styles.friendName} numberOfLines={1}>
                    {profile.display_name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Friends who've already been */}
        {friendsAttended.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('festival.friendsAttended')}</Text>
            <View style={styles.friendsList}>
              {friendsAttended.map((profile) => (
                <Pressable
                  key={profile.id}
                  style={({ pressed }) => [styles.friendRow, pressed && { opacity: 0.7 }]}
                  onPress={() => router.push({ pathname: '/user/[id]', params: { id: profile.id } })}
                >
                  <Ionicons name="checkmark-circle" size={18} color={colors.statusAttended} />
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
            onInfoPress={() => setRatingInfoOpen(true)}
          />
          <StatBox
            label={t('festival.myRating')}
            value={myFestivalReviews.length > 0 ? `${myFestivalReviews[0]!.overall_rating.toFixed(1)}/20` : '–'}
            hint={
              myFestivalReviews.length > 1
                ? t('festival.myRatingsCount', { count: myFestivalReviews.length })
                : undefined
            }
            onPress={myFestivalReviews.length > 0 ? () => setMyReviewsOpen(true) : undefined}
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
    </View>
  );
}

function StatBox({
  label,
  value,
  hint,
  onPress,
  onInfoPress,
}: {
  label: string;
  value: string;
  hint?: string;
  /** Makes the whole tile tappable — e.g. "my rating" opening the
   *  year-by-year detail instead of only ever being readable at the
   *  bottom of the page in the full review list. */
  onPress?: () => void;
  /** Small "?" next to the label for a tile whose number isn't
   *  self-explanatory (the community score is a weighted average, not a
   *  plain mean) — separate from onPress so both can coexist. */
  onInfoPress?: () => void;
}) {
  const inner = (
    <>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statLabelRow}>
        <Text style={styles.statLabel}>{label}</Text>
        {onInfoPress && (
          <Pressable onPress={onInfoPress} hitSlop={8}>
            <Ionicons name="help-circle-outline" size={13} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [styles.statBox, pressed && { opacity: 0.8 }]} onPress={onPress}>
        {inner}
      </Pressable>
    );
  }
  return <View style={styles.statBox}>{inner}</View>;
}

const styles = StyleSheet.create({
  swipeArea: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPill: {
    position: 'absolute',
    right: spacing.lg,
    backgroundColor: 'rgba(11, 11, 20, 0.65)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  navPillText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  cover: {
    height: 200,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coverLetter: {
    fontFamily: typography.fonts.heading,
    fontSize: 72,
    color: colors.primary,
  },
  body: { padding: spacing.xl, gap: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
  },
  nameText: { flex: 1 },
  shareButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    padding: spacing.sm,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
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
  cancelledRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cancelledText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.danger,
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
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
