/**
 * Generate a Spotify playlist from a festival edition's lineup.
 *
 * Modes:
 * - user connected  → creates the playlist in their Spotify account
 * - not connected   → returns a preview tracklist (app-only token)
 *
 * Rules: fair round-robin distribution across artists, deduplication,
 * confident-match-only artist search, graceful skips, max_tracks cap.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  appToken,
  jsonResponse,
  refreshUserToken,
  searchArtist,
  topTracks,
  type SpotifyTrack,
} from '../_shared/spotify.ts';

const MAX_TRACKS_DEFAULT = 50;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return jsonResponse({}, 200);

  try {
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return jsonResponse({ error: 'unauthorized' }, 401);

    const { festival_id, edition_id, max_tracks = MAX_TRACKS_DEFAULT } = await req.json();
    if (!festival_id || !edition_id) {
      return jsonResponse({ error: 'missing festival_id / edition_id' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ---- Load lineup ----
    const [{ data: festival }, { data: edition }, { data: lineup }] = await Promise.all([
      admin.from('festivals').select('name').eq('id', festival_id).single(),
      admin.from('festival_editions').select('year').eq('id', edition_id).single(),
      admin
        .from('edition_artists')
        .select('artists(id, name, spotify_artist_id)')
        .eq('edition_id', edition_id)
        .order('order_index'),
    ]);
    if (!festival || !edition) return jsonResponse({ error: 'festival/edition not found' }, 404);

    // deno-lint-ignore no-explicit-any
    const artists = (lineup ?? []).map((row: any) => row.artists).filter(Boolean);
    if (artists.length === 0) return jsonResponse({ error: 'no lineup published' }, 400);

    // ---- Pick a token: user connection or app-only (preview) ----
    const { data: connection } = await admin
      .from('spotify_connections')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let token: string;
    let mode: 'created' | 'preview';
    if (connection) {
      mode = 'created';
      token = connection.access_token;
      if (new Date(connection.expires_at).getTime() < Date.now() + 60_000) {
        const refreshed = await refreshUserToken(connection.refresh_token);
        token = refreshed.access_token;
        await admin
          .from('spotify_connections')
          .update({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token ?? connection.refresh_token,
            expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          })
          .eq('user_id', user.id);
      }
    } else {
      mode = 'preview';
      token = await appToken();
    }

    // ---- Match artists and collect top tracks ----
    const skipped: string[] = [];
    const perArtistTracks: SpotifyTrack[][] = [];

    for (const artist of artists) {
      let spotifyId: string | null = artist.spotify_artist_id;
      if (!spotifyId) {
        const match = await searchArtist(token, artist.name);
        if (match) {
          spotifyId = match.id;
          // Cache the match for next time.
          await admin.from('artists').update({ spotify_artist_id: match.id }).eq('id', artist.id);
        }
      }
      if (!spotifyId) {
        skipped.push(artist.name);
        continue;
      }
      const tracks = await topTracks(token, spotifyId);
      if (tracks.length === 0) skipped.push(artist.name);
      else perArtistTracks.push(tracks);
    }

    // ---- Fair round-robin selection with dedup ----
    const seen = new Set<string>();
    const selected: SpotifyTrack[] = [];
    for (let round = 0; selected.length < max_tracks; round++) {
      let added = false;
      for (const tracks of perArtistTracks) {
        const track = tracks[round];
        if (!track || seen.has(track.id)) continue;
        seen.add(track.id);
        selected.push(track);
        added = true;
        if (selected.length >= max_tracks) break;
      }
      if (!added) break; // every artist exhausted
    }

    const playlistName = `${festival.name} ${edition.year} Lineup Playlist`;
    let playlistUrl: string | undefined;
    let playlistId: string | undefined;

    // ---- Create the real playlist when the user is connected ----
    if (mode === 'created' && connection && selected.length > 0) {
      const createRes = await fetch(
        `https://api.spotify.com/v1/users/${connection.spotify_user_id}/playlists`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: playlistName,
            description: 'Generated with Festiq — track every beat.',
            public: false,
          }),
        },
      );
      if (!createRes.ok) return jsonResponse({ error: await createRes.text() }, 502);
      const playlist = await createRes.json();
      playlistId = playlist.id;
      playlistUrl = playlist.external_urls?.spotify;

      for (let i = 0; i < selected.length; i += 100) {
        await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ uris: selected.slice(i, i + 100).map((t) => t.uri) }),
        });
      }
    }

    // ---- Log the generation ----
    await admin.from('playlists_generated').insert({
      user_id: user.id,
      festival_id,
      edition_id,
      spotify_playlist_id: playlistId ?? null,
      playlist_name: playlistName,
      total_artists: artists.length,
      matched_artists: perArtistTracks.length,
      total_tracks: selected.length,
      status: mode,
    });

    return jsonResponse({
      mode,
      playlist_name: playlistName,
      playlist_url: playlistUrl,
      total_artists: artists.length,
      matched_artists: perArtistTracks.length,
      total_tracks: selected.length,
      skipped,
      tracks: selected.map((t) => ({ name: t.name, artist: t.artistName })),
    });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
