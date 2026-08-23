import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';
import { useMyAttendances } from '@/features/festivals/api';

export interface ArtistProfile {
  id: string;
  name: string;
  genres: string[];
}

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

/** Full profiles of followed artists, for the "my artists" list screen. */
export function useMyFollowedArtistProfiles() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-followed-artist-profiles', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ArtistProfile[]> => {
      const { data, error } = await supabase.from('artist_follows').select('artists(id, name, genres)');
      if (error) throw error;
      return (data as unknown as { artists: ArtistProfile }[])
        .map((r) => r.artists)
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

/** Search artists by name, to follow one not already surfaced via a lineup. */
export function useSearchArtists(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['artist-search', trimmed],
    enabled: trimmed.length >= 2,
    queryFn: async (): Promise<ArtistProfile[]> => {
      const escaped = trimmed.replace(/[%_\\]/g, (m) => `\\${m}`);
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, genres')
        .ilike('name', `%${escaped}%`)
        .order('name')
        .limit(20);
      if (error) throw error;
      return data as ArtistProfile[];
    },
  });
}

/** One artist's basic profile, for the detail screen header. */
export function useArtist(artistId: string | undefined) {
  return useQuery({
    queryKey: ['artist', artistId],
    enabled: !!artistId,
    queryFn: async (): Promise<ArtistProfile> => {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, genres')
        .eq('id', artistId!)
        .single();
      if (error) throw error;
      return data as ArtistProfile;
    },
  });
}

export interface ArtistUpcomingFestival {
  festivalId: string;
  festivalName: string;
  festivalSlug: string;
  country: string;
  year: number;
  startDate: string | null;
  endDate: string | null;
}

export interface ArtistSeenFestival {
  festivalId: string;
  festivalName: string;
  festivalSlug: string;
  country: string;
  years: number[];
}

/**
 * One artist's announced lineup slots, split into what's still ahead and
 * what the signed-in user actually attended — the latter cross-references
 * edition_artists against user_attendances by (festival_id, year), the same
 * pairing useMyMostSeenArtist uses, so a festival only counts as "seen"
 * when the artist played the specific edition the user logged, not just
 * any edition of that festival ever.
 */
export function useArtistFestivals(artistId: string | undefined) {
  const { data: attendances } = useMyAttendances();
  return useQuery({
    queryKey: ['artist-festivals', artistId],
    enabled: !!artistId,
    queryFn: async (): Promise<{
      upcoming: ArtistUpcomingFestival[];
      seen: ArtistSeenFestival[];
      totalSeenCount: number;
    }> => {
      const { data, error } = await supabase
        .from('edition_artists')
        .select(
          'festival_editions!inner(year, start_date, end_date, festivals!inner(id, name, slug, country))',
        )
        .eq('artist_id', artistId!)
        .eq('announced', true);
      if (error) throw error;

      const rows = (
        data as unknown as {
          festival_editions: {
            year: number;
            start_date: string | null;
            end_date: string | null;
            festivals: { id: string; name: string; slug: string; country: string };
          };
        }[]
      ).map((r) => ({
        festivalId: r.festival_editions.festivals.id,
        festivalName: r.festival_editions.festivals.name,
        festivalSlug: r.festival_editions.festivals.slug,
        country: r.festival_editions.festivals.country,
        year: r.festival_editions.year,
        startDate: r.festival_editions.start_date,
        endDate: r.festival_editions.end_date,
      }));

      const today = new Date().toISOString().slice(0, 10);
      const upcoming = rows
        .filter((r) => r.startDate && r.startDate >= today)
        .sort((a, b) => a.startDate!.localeCompare(b.startDate!));

      const attendedKeys = new Set(
        (attendances ?? []).map((a) => `${a.festival_id}:${a.attended_year}`),
      );
      const seenByFestival = new Map<string, ArtistSeenFestival>();
      for (const r of rows) {
        if (!attendedKeys.has(`${r.festivalId}:${r.year}`)) continue;
        const existing = seenByFestival.get(r.festivalId);
        if (existing) existing.years.push(r.year);
        else {
          seenByFestival.set(r.festivalId, {
            festivalId: r.festivalId,
            festivalName: r.festivalName,
            festivalSlug: r.festivalSlug,
            country: r.country,
            years: [r.year],
          });
        }
      }
      const seen = [...seenByFestival.values()].sort((a, b) =>
        a.festivalName.localeCompare(b.festivalName),
      );
      // Not seen.length — a festival attended in several different years
      // with this artist on the bill each time counts once per year, which
      // seen.length can't capture since it's already deduped to one entry
      // per festival.
      const totalSeenCount = seen.reduce((sum, s) => sum + s.years.length, 0);

      return { upcoming, seen, totalSeenCount };
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
