import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';
import type {
  DjMagRanking,
  Festival,
  FestivalCommunityStats,
  FestivalEdition,
  FestivalStatus,
  UserFestivalStatus,
} from '@/types/domain';

/**
 * Catalog is small for the MVP, so we fetch it once with stats and filter
 * client-side. TODO(phase 2): server-side search/pagination once the catalog
 * grows past a few hundred rows.
 */
export function useFestivals() {
  return useQuery({
    queryKey: ['festivals'],
    queryFn: async () => {
      const [festivals, stats] = await Promise.all([
        supabase.from('festivals').select('*').order('name'),
        supabase.from('festival_community_stats').select('*'),
      ]);
      if (festivals.error) throw festivals.error;
      if (stats.error) throw stats.error;

      const statsById = new Map<string, FestivalCommunityStats>(
        (stats.data as FestivalCommunityStats[]).map((s) => [s.festival_id, s]),
      );
      return (festivals.data as Festival[]).map((festival) => ({
        festival,
        stats: statsById.get(festival.id),
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
      const { data, error } = await supabase.from('user_festival_statuses').select('*');
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
