import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { functionsErrorMessage } from '@/lib/functions';

export interface ExportTrack {
  artistName: string;
  title: string;
  deezerUrl: string;
  spotifySearchUrl: string;
  youtubeMusicSearchUrl: string;
  soundcloudSearchUrl: string;
}

export interface GeneratePlaylistExportResult {
  playlistName: string;
  totalArtists: number;
  matchedArtists: number;
  skippedArtists: string[];
  tracks: ExportTrack[];
}

/**
 * Builds a shareable track list without requiring an account on any of
 * these services: each track links to its real Deezer page (public catalog
 * lookup, no OAuth needed) plus a search deep link for Spotify, YouTube
 * Music and SoundCloud — none of those three can be resolved to an actual
 * track here (see generate-playlist-export), so the user picks the match.
 */
export function useGeneratePlaylistExport() {
  return useMutation({
    mutationFn: async ({ festivalId, editionId }: { festivalId: string; editionId: string }) => {
      const { data, error } = await supabase.functions.invoke<GeneratePlaylistExportResult>(
        'generate-playlist-export',
        { body: { festivalId, editionId } },
      );
      if (error) throw new Error(await functionsErrorMessage(error));
      return data!;
    },
  });
}
