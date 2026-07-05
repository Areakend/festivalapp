import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { functionsErrorMessage } from '@/lib/functions';

export interface ExportTrack {
  artistName: string;
  title: string;
  deezerUrl: string;
  spotifySearchUrl: string;
}

export interface GeneratePlaylistExportResult {
  playlistName: string;
  totalArtists: number;
  matchedArtists: number;
  skippedArtists: string[];
  tracks: ExportTrack[];
}

/**
 * Builds a shareable track list without requiring a Spotify or Deezer
 * account: each track links to its real Deezer page (public catalog lookup,
 * no OAuth needed) and to a Spotify search for the same artist/title.
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
