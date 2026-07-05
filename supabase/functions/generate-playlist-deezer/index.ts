import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import {
  addTracksToDeezerPlaylist,
  createDeezerPlaylist,
  getDeezerArtistTopTracks,
  searchDeezerArtist,
} from '../_shared/deezer.ts';

const TRACKS_PER_ARTIST = 3;

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

    const { data: connection, error: connError } = await supabase
      .from('deezer_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (connError || !connection) throw new Error('Deezer not connected');

    const accessToken = connection.access_token as string;

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

    const trackIds: string[] = [];
    const skippedArtists: string[] = [];
    let matchedArtists = 0;

    for (const entry of lineup as unknown as {
      order_index: number;
      artists: { id: string; name: string; deezer_artist_id: string | null };
    }[]) {
      const artist = entry.artists;
      let deezerArtistId = artist.deezer_artist_id;

      if (!deezerArtistId) {
        const search = await searchDeezerArtist(artist.name, accessToken);
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
      const topTracks = await getDeezerArtistTopTracks(deezerArtistId, accessToken, TRACKS_PER_ARTIST);
      for (const track of topTracks.data ?? []) {
        trackIds.push(String(track.id));
      }
    }

    if (trackIds.length === 0) throw new Error('No tracks matched on Deezer for this lineup');

    const playlistName = `${festival.name} ${edition.year}`;
    const playlist = await createDeezerPlaylist(connection.deezer_user_id, playlistName, accessToken);

    // Deezer caps "add tracks" at 25 songs per request (undocumented but common failure).
    for (let i = 0; i < trackIds.length; i += 25) {
      await addTracksToDeezerPlaylist(String(playlist.id), trackIds.slice(i, i + 25), accessToken);
    }

    await supabase.from('playlists_generated').insert({
      user_id: user.id,
      festival_id: festivalId,
      edition_id: editionId,
      provider: 'deezer',
      deezer_playlist_id: String(playlist.id),
      playlist_name: playlistName,
      total_artists: lineup.length,
      matched_artists: matchedArtists,
      total_tracks: trackIds.length,
      status: 'created',
    });

    return new Response(
      JSON.stringify({
        playlistUrl: `https://www.deezer.com/playlist/${playlist.id}`,
        playlistId: String(playlist.id),
        totalArtists: lineup.length,
        matchedArtists,
        totalTracks: trackIds.length,
        skippedArtists,
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
