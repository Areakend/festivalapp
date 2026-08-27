import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { getDeezerArtistTopTracks, searchDeezerArtist } from '../_shared/deezer.ts';

const TRACKS_PER_ARTIST = 3;

interface ExportTrack {
  artistName: string;
  title: string;
  deezerUrl: string;
  spotifySearchUrl: string;
  youtubeMusicSearchUrl: string;
  soundcloudSearchUrl: string;
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

    // Reject mismatched festival/edition pairs (same check as
    // generate-playlist) so the export can never carry another
    // festival's name.
    const [{ data: festival, error: festivalError }, { data: edition, error: editionError }] =
      await Promise.all([
        supabase.from('festivals').select('name').eq('id', festivalId).single(),
        supabase
          .from('festival_editions')
          .select('year')
          .eq('id', editionId)
          .eq('festival_id', festivalId)
          .single(),
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
      try {
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

        const topTracks = await getDeezerArtistTopTracks(deezerArtistId, TRACKS_PER_ARTIST);
        matchedArtists += 1;
        for (const track of topTracks.data ?? []) {
          const query = encodeURIComponent(`${artist.name} ${track.title}`);
          tracks.push({
            artistName: artist.name,
            title: track.title,
            deezerUrl: `https://www.deezer.com/track/${track.id}`,
            // Neither Spotify (no catalog access outside the curator's own Web
            // API session — see spotify-auth), YouTube Music (no public API at
            // all, only the quota-limited authenticated YouTube Data API) nor
            // SoundCloud (closed app registrations, see 20260705130000) can be
            // resolved to a real track link here — these three are all search
            // deep links instead, the user picks the matching result themselves.
            spotifySearchUrl: `https://open.spotify.com/search/${query}`,
            youtubeMusicSearchUrl: `https://music.youtube.com/search?q=${query}`,
            soundcloudSearchUrl: `https://soundcloud.com/search?q=${query}`,
          });
        }
      } catch (artistError) {
        // One artist still failing after deezer.ts's own throttling and
        // retries (e.g. a sustained quota hit on a huge lineup) shouldn't
        // sink the whole export — treat it like "not found on Deezer" and
        // keep going, same as the app's own "some tracks skipped" UI.
        console.error(`Deezer lookup failed for ${artist.name}:`, (artistError as Error).message);
        skippedArtists.push(artist.name);
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
