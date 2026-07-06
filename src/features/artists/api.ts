import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';

/** The signed-in user's followed artists (in-app only, no Spotify required). */
export function useMyFollowedArtists() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-followed-artists', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('artist_follows').select('artist_id');
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.artist_id as string));
    },
  });
}

/** Follow/unfollow an artist in-app — no external account needed. */
export function useToggleArtistFollow() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async ({ artistId, following }: { artistId: string; following: boolean }) => {
      if (!userId) throw new Error('Not signed in');
      if (following) {
        const { error } = await supabase
          .from('artist_follows')
          .delete()
          .eq('user_id', userId)
          .eq('artist_id', artistId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('artist_follows')
          .insert({ user_id: userId, artist_id: artistId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-followed-artists'] });
    },
  });
}

export interface FollowedArtistsRankingEntry {
  festivalId: string;
  matchedCount: number;
  matchedArtists: string[];
}

/**
 * Ranks festivals by how many followed artists are in their lineup (any
 * year) — purely a local join over already-fetched data, no server round
 * trip beyond the one query below.
 */
export function useFollowedArtistsRanking() {
  const { data: followedIds } = useMyFollowedArtists();
  const ids = followedIds ? [...followedIds] : [];
  return useQuery({
    queryKey: ['followed-artists-ranking', ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edition_artists')
        .select('artist_id, artists(id, name), festival_editions(festivals(id))')
        .in('artist_id', ids);
      if (error) throw error;

      const byFestival = new Map<string, { artistIds: Set<string>; artistNames: string[] }>();
      for (const row of (data ?? []) as unknown as {
        artist_id: string;
        artists: { id: string; name: string };
        festival_editions: { festivals: { id: string } };
      }[]) {
        const festivalId = row.festival_editions.festivals.id;
        let entry = byFestival.get(festivalId);
        if (!entry) {
          entry = { artistIds: new Set(), artistNames: [] };
          byFestival.set(festivalId, entry);
        }
        if (!entry.artistIds.has(row.artist_id)) {
          entry.artistIds.add(row.artist_id);
          entry.artistNames.push(row.artists.name);
        }
      }

      const ranking: FollowedArtistsRankingEntry[] = [...byFestival.entries()].map(
        ([festivalId, entry]) => ({
          festivalId,
          matchedCount: entry.artistIds.size,
          matchedArtists: entry.artistNames,
        }),
      );
      ranking.sort((a, b) => b.matchedCount - a.matchedCount);
      return ranking;
    },
  });
}
