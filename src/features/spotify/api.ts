import { useMutation, useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { functionsErrorMessage } from '@/lib/functions';

export interface GeneratePlaylistResult {
  playlistUrl: string;
  playlistId: string;
  totalArtists: number;
  matchedArtists: number;
  totalTracks: number;
  skippedArtists: string[];
}

export function useGeneratePlaylist() {
  return useMutation({
    mutationFn: async ({ festivalId, editionId }: { festivalId: string; editionId: string }) => {
      const { data, error } = await supabase.functions.invoke<GeneratePlaylistResult>('generate-playlist', {
        body: { festivalId, editionId },
      });
      if (error) throw new Error(await functionsErrorMessage(error));
      return data!;
    },
  });
}

export interface FestivalPlaylistCache {
  spotify_playlist_id: string;
  spotify_playlist_url: string;
  total_artists: number;
  matched_artists: number;
  total_tracks: number;
  skipped_artists: string[];
}

/**
 * One shared public playlist per edition (Option 1: generated once under
 * the app's own curator Spotify account instead of every user connecting
 * their own — see generate-playlist). Reads the cache table directly so a
 * returning user sees "Open playlist" immediately, with no Edge Function
 * round trip needed until someone has to generate it for the first time.
 */
export function useFestivalPlaylistCache(editionId: string | undefined) {
  return useQuery({
    queryKey: ['festival-playlist-cache', editionId],
    enabled: !!editionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('festival_playlists')
        .select('spotify_playlist_id, spotify_playlist_url, total_artists, matched_artists, total_tracks, skipped_artists')
        .eq('edition_id', editionId)
        .maybeSingle();
      if (error) throw error;
      return data as FestivalPlaylistCache | null;
    },
  });
}
