import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';
import type {
  DjMagRanking,
  Festival,
  FestivalCommunityStats,
  FestivalEdition,
  FestivalStatus,
  UserAttendance,
  UserFestivalStatus,
} from '@/types/domain';

export interface CatalogItem {
  festival: Festival;
  stats: FestivalCommunityStats | undefined;
  /** Soonest edition starting today or later (undefined if none is dated). */
  nextEdition: { year: number; start_date: string; end_date: string | null } | undefined;
  /** Position in the most recent DJ Mag Top 100 (undefined if not ranked this year). */
  djmagRank: number | undefined;
}

/**
 * Catalog is small for the MVP, so we fetch it once with stats, upcoming
 * edition dates and current DJ Mag ranks, then filter client-side.
 * TODO(phase 2): server-side search/pagination once the catalog grows.
 */
export function useFestivals() {
  return useQuery({
    queryKey: ['festivals'],
    queryFn: async (): Promise<CatalogItem[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const [festivals, stats, editions, latestRank] = await Promise.all([
        supabase.from('festivals').select('*').order('name'),
        supabase.from('festival_community_stats').select('*'),
        supabase
          .from('festival_editions')
          .select('festival_id, year, start_date, end_date')
          .gte('start_date', today)
          .order('start_date'),
        supabase
          .from('djmag_rankings')
          .select('year')
          .order('year', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (festivals.error) throw festivals.error;
      if (stats.error) throw stats.error;
      if (editions.error) throw editions.error;

      let rankByFestival = new Map<string, number>();
      if (latestRank.data) {
        const { data: rankings, error: rankError } = await supabase
          .from('djmag_rankings')
          .select('festival_id, rank_position')
          .eq('year', latestRank.data.year);
        if (rankError) throw rankError;
        rankByFestival = new Map(rankings.map((r) => [r.festival_id, r.rank_position]));
      }

      const statsById = new Map<string, FestivalCommunityStats>(
        (stats.data as FestivalCommunityStats[]).map((s) => [s.festival_id, s]),
      );
      // editions come back sorted by start_date, so the first hit per
      // festival is its next upcoming one.
      const nextEditionByFestival = new Map<
        string,
        { year: number; start_date: string; end_date: string | null }
      >();
      for (const e of editions.data as {
        festival_id: string;
        year: number;
        start_date: string;
        end_date: string | null;
      }[]) {
        if (!nextEditionByFestival.has(e.festival_id)) {
          nextEditionByFestival.set(e.festival_id, e);
        }
      }

      return (festivals.data as Festival[]).map((festival) => ({
        festival,
        stats: statsById.get(festival.id),
        nextEdition: nextEditionByFestival.get(festival.id),
        djmagRank: rankByFestival.get(festival.id),
      }));
    },
  });
}

export interface FestivalDetail {
  festival: Festival;
  editions: FestivalEdition[];
  rankings: DjMagRanking[];
  stats: FestivalCommunityStats | undefined;
}

export function useFestivalDetail(slug: string) {
  return useQuery({
    queryKey: ['festival', slug],
    enabled: !!slug,
    queryFn: async (): Promise<FestivalDetail> => {
      const { data: festival, error } = await supabase
        .from('festivals')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;

      const [editions, rankings, stats] = await Promise.all([
        supabase
          .from('festival_editions')
          .select('*')
          .eq('festival_id', festival.id)
          .order('year', { ascending: false }),
        supabase
          .from('djmag_rankings')
          .select('*')
          .eq('festival_id', festival.id)
          .order('year', { ascending: false }),
        supabase
          .from('festival_community_stats')
          .select('*')
          .eq('festival_id', festival.id)
          .maybeSingle(),
      ]);
      if (editions.error) throw editions.error;
      if (rankings.error) throw rankings.error;

      return {
        festival: festival as Festival,
        editions: (editions.data ?? []) as FestivalEdition[],
        rankings: (rankings.data ?? []) as DjMagRanking[],
        stats: (stats.data ?? undefined) as FestivalCommunityStats | undefined,
      };
    },
  });
}

export interface LineupEntry {
  order_index: number;
  artists: { id: string; name: string; genres: string[] };
}

/** Announced lineup of an edition, headliners first. */
export function useEditionLineup(editionId: string | undefined) {
  return useQuery({
    queryKey: ['lineup', editionId],
    enabled: !!editionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edition_artists')
        .select('order_index, artists(id, name, genres)')
        .eq('edition_id', editionId!)
        .eq('announced', true)
        .order('order_index');
      if (error) throw error;
      return data as unknown as LineupEntry[];
    },
  });
}

/** All tracking statuses of the signed-in user (small table, cached once). */
export function useMyStatuses() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-statuses', userId],
    enabled: !!userId,
    queryFn: async () => {
      // Explicit user_id filter: RLS also lets friends' rows through (see
      // "statuses friends read"), which this query must not pick up —
      // friends' statuses aren't toggleable/owned by the current user.
      const { data, error } = await supabase
        .from('user_festival_statuses')
        .select('*')
        .eq('user_id', userId!);
      if (error) throw error;
      return data as UserFestivalStatus[];
    },
  });
}

/** Toggle a tracking status (attended/planned/wishlist/favorite) on a festival. */
export function useToggleStatus() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async (input: { festivalId: string; status: FestivalStatus; active: boolean }) => {
      if (!userId) throw new Error('Not signed in');
      if (input.active) {
        const { error } = await supabase
          .from('user_festival_statuses')
          .delete()
          .eq('user_id', userId)
          .eq('festival_id', input.festivalId)
          .eq('status', input.status);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_festival_statuses')
          .insert({ user_id: userId, festival_id: input.festivalId, status: input.status });
        if (error) throw error;
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['my-statuses'] }),
  });
}

/**
 * Detailed per-year attendance log, supplementing the quick "attended"
 * status above for people who want to record exactly which edition(s)
 * of a festival they went to (small table, cached once like statuses).
 */
export function useMyAttendances() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-attendances', userId],
    enabled: !!userId,
    queryFn: async () => {
      // Explicit user_id filter: user_attendances is now publicly
      // readable to any signed-in user (see the public-history RLS
      // policy), which this query must not pick up — without it, "my"
      // attendances silently included everyone's, e.g. surfacing a
      // stranger's festival as "my last festival" to share.
      // Column list, not '*': notes is no longer grant-visible (see the
      // security-review-fixes migration) so '*' would silently drop it —
      // spelling out the columns we actually use keeps that intentional.
      const { data, error } = await supabase
        .from('user_attendances')
        .select('id, user_id, festival_id, edition_id, attended_year, created_at, updated_at')
        .eq('user_id', userId!)
        .order('attended_year', { ascending: false });
      if (error) throw error;
      // notes isn't selected (no longer grant-visible), so this is
      // deliberately narrower than the full UserAttendance shape.
      return data as Omit<UserAttendance, 'notes'>[];
    },
  });
}

export function useAddAttendance() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async (input: { festivalId: string; year: number }) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('user_attendances')
        .insert({ user_id: userId, festival_id: input.festivalId, attended_year: input.year });
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['my-attendances'] }),
  });
}

export function useRemoveAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attendanceId: string) => {
      const { error } = await supabase.from('user_attendances').delete().eq('id', attendanceId);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['my-attendances'] }),
  });
}

/**
 * Which artist appears the most often across the lineups of every edition
 * the user has logged as attended (matched by festival_id + attended_year
 * against festival_editions, since attendances don't always carry an
 * edition_id). Used for the profile's "most-seen artist" stat.
 */
export function useMyMostSeenArtist() {
  const { data: attendances } = useMyAttendances();
  const key = (attendances ?? []).map((a) => `${a.festival_id}:${a.attended_year}`).sort().join(',');

  return useQuery({
    queryKey: ['my-most-seen-artist', key],
    enabled: !!attendances && attendances.length > 0,
    queryFn: async () => {
      const festivalIds = [...new Set(attendances!.map((a) => a.festival_id))];
      const { data: editions, error: editionsError } = await supabase
        .from('festival_editions')
        .select('id, festival_id, year')
        .in('festival_id', festivalIds);
      if (editionsError) throw editionsError;

      const editionIdByKey = new Map(
        (editions as { id: string; festival_id: string; year: number }[]).map((e) => [
          `${e.festival_id}:${e.year}`,
          e.id,
        ]),
      );
      const relevantEditionIds = attendances!
        .map((a) => editionIdByKey.get(`${a.festival_id}:${a.attended_year}`))
        .filter((id): id is string => id != null);
      if (relevantEditionIds.length === 0) return null;

      const { data: lineups, error: lineupError } = await supabase
        .from('edition_artists')
        .select('artists(id, name)')
        .in('edition_id', relevantEditionIds);
      if (lineupError) throw lineupError;

      const counts = new Map<string, { name: string; count: number }>();
      for (const entry of lineups as unknown as { artists: { id: string; name: string } }[]) {
        const a = entry.artists;
        const cur = counts.get(a.id) ?? { name: a.name, count: 0 };
        cur.count += 1;
        counts.set(a.id, cur);
      }

      let best: { name: string; count: number } | null = null;
      for (const v of counts.values()) {
        if (!best || v.count > best.count) best = v;
      }
      return best;
    },
  });
}

/**
 * For a set of festivals, the most recent edition of each that has already
 * fully finished (end_date, or start_date if undated end, is in the past).
 * Unlike useFestivals' nextEdition (which only looks forward), this is what
 * lets useAutoAdvancePlannedFestivals find the edition that was "next" when
 * a festival was marked planned and has since happened.
 */
function usePastEditionsForFestivals(festivalIds: string[]) {
  const key = [...festivalIds].sort().join(',');
  return useQuery({
    queryKey: ['past-editions', key],
    enabled: festivalIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('festival_editions')
        .select('festival_id, year, start_date, end_date')
        .in('festival_id', festivalIds)
        .order('start_date', { ascending: false });
      if (error) throw error;

      const today = new Date().toISOString().slice(0, 10);
      // Rows are ordered by start_date desc, so the first row per festival
      // is its LATEST edition on record — past or future. Only that one
      // matters: if it's still upcoming, the festival isn't "finished" even
      // though some older edition already happened (a bug this used to
      // have — it fell through to an older finished edition and wrongly
      // auto-advanced festivals that still had an upcoming edition planned).
      const latestByFestival = new Map<
        string,
        { year: number; start_date: string; end_date: string | null }
      >();
      for (const e of data as {
        festival_id: string;
        year: number;
        start_date: string | null;
        end_date: string | null;
      }[]) {
        if (!e.start_date || latestByFestival.has(e.festival_id)) continue;
        latestByFestival.set(e.festival_id, { year: e.year, start_date: e.start_date, end_date: e.end_date });
      }

      const byFestival = new Map<string, { year: number }>();
      for (const [festivalId, e] of latestByFestival) {
        const finishedBy = e.end_date ?? e.start_date;
        if (finishedBy < today) byFestival.set(festivalId, { year: e.year });
      }
      return byFestival;
    },
  });
}

/**
 * Once a "planned" festival's edition has actually finished, promote it to
 * "attended" and log that year in user_attendances automatically — so
 * stats and the profile stay accurate without the user remembering to
 * update it by hand after the fact. Side-effect-only hook: mount it once
 * near the app root (the home screen, since that's the first thing opened
 * each session).
 */
export function useAutoAdvancePlannedFestivals() {
  const { data: myStatuses } = useMyStatuses();
  const { data: myAttendances } = useMyAttendances();
  const toggleStatus = useToggleStatus();
  const addAttendance = useAddAttendance();

  const plannedFestivalIds = (myStatuses ?? [])
    .filter((s) => s.status === 'planned')
    .map((s) => s.festival_id);

  const { data: pastEditions } = usePastEditionsForFestivals(plannedFestivalIds);

  useEffect(() => {
    if (!pastEditions || pastEditions.size === 0) return;
    for (const festivalId of plannedFestivalIds) {
      const past = pastEditions.get(festivalId);
      if (!past) continue;

      toggleStatus.mutate({ festivalId, status: 'planned', active: true }); // remove
      const alreadyAttended = (myStatuses ?? []).some(
        (s) => s.festival_id === festivalId && s.status === 'attended',
      );
      if (!alreadyAttended) {
        toggleStatus.mutate({ festivalId, status: 'attended', active: false }); // add
      }
      const alreadyLogged = (myAttendances ?? []).some(
        (a) => a.festival_id === festivalId && a.attended_year === past.year,
      );
      if (!alreadyLogged) {
        addAttendance.mutate({ festivalId, year: past.year });
      }
    }
    // Runs again only when pastEditions changes — each processed festival
    // drops out of plannedFestivalIds once its status flips, so this can't
    // loop on the same festival twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastEditions]);
}
