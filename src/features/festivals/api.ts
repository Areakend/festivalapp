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
      const { data, error } = await supabase
        .from('user_attendances')
        .select('*')
        .order('attended_year', { ascending: false });
      if (error) throw error;
      return data as UserAttendance[];
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
