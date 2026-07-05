import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { getDeezerArtistTopTracks, searchDeezerArtist } from '../_shared/deezer.ts';

const TRACKS_PER_ARTIST = 3;

interface ExportTrack {
  artistName: string;
  title: string;
  deezerUrl: string;
  spotifySearchUrl: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error('Not authenticated');

    const { festivalId, editionId } = await req.json();
    if (!festivalId || !editionId) throw new Error('Missing festivalId or editionId');

    const [{ data: festival, error: festivalError }, { data: edition, error: editionError }] =
      await Promise.all([
        supabase.from('festivals').select('name').eq('id', festivalId).single(),
        supabase.from('festival_editions').select('year').eq('id', editionId).single(),
      ]);
    if (festivalError || !festival) throw new Error('Festival not found');
    if (editionError || !edition) throw new Error('Edition not found');

    const { data: lineup, error: lineupError } = await supabase
      .from('edition_artists')
      .select('order_index, artists(id, name, deezer_artist_id)')
      .eq('edition_id', editionId)
      .order('order_index', { ascending: true });
    if (lineupError) throw lineupError;
    if (!lineup || lineup.length === 0) throw new Error('No lineup published for this edition');

    const tracks: ExportTrack[] = [];
    const skippedArtists: string[] = [];
    let matchedArtists = 0;

    for (const entry of lineup as unknown as {
      order_index: number;
      artists: { id: string; name: string; deezer_artist_id: string | null };
    }[]) {
      const artist = entry.artists;
      let deezerArtistId = artist.deezer_artist_id;

      if (!deezerArtistId) {
        const search = await searchDeezerArtist(artist.name);
        deezerArtistId = search.data?.[0]?.id != null ? String(search.data[0].id) : null;
        if (deezerArtistId) {
          await supabase.from('artists').update({ deezer_artist_id: deezerArtistId }).eq('id', artist.id);
        }
      }

      if (!deezerArtistId) {
        skippedArtists.push(artist.name);
        continue;
      }

      matchedArtists += 1;
      const topTracks = await getDeezerArtistTopTracks(deezerArtistId, TRACKS_PER_ARTIST);
      for (const track of topTracks.data ?? []) {
        tracks.push({
          artistName: artist.name,
          title: track.title,
          deezerUrl: `https://www.deezer.com/track/${track.id}`,
          // No Spotify catalog access without going through the Web API (currently
          // blocked — see spotify-auth), so this is a search deep link rather than
          // a resolved track: it opens Spotify's app/site with the right query,
          // the user picks the matching result themselves.
          spotifySearchUrl: `https://open.spotify.com/search/${encodeURIComponent(`${artist.name} ${track.title}`)}`,
        });
      }
    }

    if (tracks.length === 0) throw new Error('No tracks matched for this lineup');

    return new Response(
      JSON.stringify({
        playlistName: `${festival.name} ${edition.year}`,
        totalArtists: lineup.length,
        matchedArtists,
        skippedArtists,
        tracks,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
