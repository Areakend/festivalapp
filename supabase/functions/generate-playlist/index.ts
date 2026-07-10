import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { getSpotifyProfile, refreshAccessToken } from '../_shared/spotify.ts';

const TRACKS_PER_ARTIST = 3;
// Supabase auth.users.id of the app's own curator account — the only
// Spotify account this function ever creates playlists under. Set once via
// `supabase secrets set CURATOR_SPOTIFY_USER_ID=<uuid>` after that account
// has connected Spotify from the app's own profile screen (same OAuth flow
// as any user). Playlists are created public, one per edition, and cached
// in festival_playlists so every other user is redirected to the same
// playlist instead of triggering their own Spotify OAuth grant.
const CURATOR_USER_ID = Deno.env.get('CURATOR_SPOTIFY_USER_ID')!;

async function spotifyFetch(path: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`Spotify API ${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

/**
 * "Get Artist's Top Tracks" returns 403 for apps that don't have Spotify's
 * Extended Quota Mode approval (a Development Mode restriction, not
 * something wrong with any specific artist) — fall back to a plain track
 * search for that artist, which stays on the unrestricted /search endpoint.
 *
 * The two attempts are independent try/catches (not one try with a catch
 * that itself calls the fallback) so that a failure of the fallback search
 * can never surface as — or be confused with — the original top-tracks
 * error: this always resolves, never throws.
 */
async function getArtistTracks(
  spotifyArtistId: string,
  artistName: string,
  accessToken: string,
): Promise<string[]> {
  try {
    const topTracks = await spotifyFetch(`/artists/${spotifyArtistId}/top-tracks?market=US`, accessToken);
    const uris = (topTracks.tracks ?? []).slice(0, TRACKS_PER_ARTIST).map((t: { uri: string }) => t.uri);
    if (uris.length > 0) return uris;
  } catch {
    // Development Mode restriction (or any other failure) — try search instead.
  }

  try {
    const search = await spotifyFetch(
      `/search?type=track&limit=${TRACKS_PER_ARTIST}&q=${encodeURIComponent(`artist:"${artistName}"`)}`,
      accessToken,
    );
    return (search.tracks?.items ?? []).map((t: { uri: string }) => t.uri);
  } catch {
    return [];
  }
}

interface CachedPlaylistRow {
  spotify_playlist_id: string;
  spotify_playlist_url: string;
  total_artists: number;
  matched_artists: number;
  total_tracks: number;
  skipped_artists: string[];
}

function respondFromCache(row: CachedPlaylistRow) {
  return new Response(
    JSON.stringify({
      playlistUrl: row.spotify_playlist_url,
      playlistId: row.spotify_playlist_id,
      totalArtists: row.total_artists,
      matchedArtists: row.matched_artists,
      totalTracks: row.total_tracks,
      skippedArtists: row.skipped_artists,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
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

    // Fast path: this edition's playlist already exists — every user after
    // the first is redirected to it, no Spotify API calls at all.
    const { data: cached } = await supabase
      .from('festival_playlists')
      .select('*')
      .eq('edition_id', editionId)
      .maybeSingle();
    if (cached) return respondFromCache(cached as CachedPlaylistRow);

    if (!CURATOR_USER_ID) throw new Error('Playlist curation is not configured yet.');

    const { data: connection, error: connError } = await supabase
      .from('spotify_connections')
      .select('*')
      .eq('user_id', CURATOR_USER_ID)
      .single();
    if (connError || !connection) throw new Error('Curator Spotify account is not connected.');

    // Always refresh, not just when expired: the refresh response carries the
    // scopes actually granted to this connection — Spotify has no other
    // introspection endpoint. Without this, a connection authorized before
    // the playlist scopes were requested fails playlist creation with a bare
    // 403 Forbidden and no way to tell the user what to do about it.
    const refreshed = await refreshAccessToken(connection.refresh_token);
    const accessToken = refreshed.access_token;
    await supabase
      .from('spotify_connections')
      .update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      })
      .eq('user_id', CURATOR_USER_ID);

    if (refreshed.scope && !refreshed.scope.includes('playlist-modify-public')) {
      throw new Error(
        'The curator Spotify connection is missing the playlist permission. Reconnect Spotify on the curator account and retry.',
      );
    }

    const [{ data: festival, error: festivalError }, { data: edition, error: editionError }] =
      await Promise.all([
        supabase.from('festivals').select('name').eq('id', festivalId).single(),
        supabase.from('festival_editions').select('year').eq('id', editionId).single(),
      ]);
    if (festivalError || !festival) throw new Error('Festival not found');
    if (editionError || !edition) throw new Error('Edition not found');

    const { data: lineup, error: lineupError } = await supabase
      .from('edition_artists')
      .select('order_index, artists(id, name, spotify_artist_id)')
      .eq('edition_id', editionId)
      .order('order_index', { ascending: true });
    if (lineupError) throw lineupError;
    if (!lineup || lineup.length === 0) throw new Error('No lineup published for this edition');

    const trackUris: string[] = [];
    const skippedArtists: string[] = [];
    let matchedArtists = 0;

    for (const entry of lineup as unknown as {
      order_index: number;
      artists: { id: string; name: string; spotify_artist_id: string | null };
    }[]) {
      const artist = entry.artists;
      // A single artist's Spotify calls failing (rate limit, API-level
      // restriction, transient error...) shouldn't take down the whole
      // playlist — skip that artist and keep going.
      try {
        let spotifyArtistId = artist.spotify_artist_id;

        if (!spotifyArtistId) {
          const search = await spotifyFetch(
            `/search?type=artist&limit=1&q=${encodeURIComponent(artist.name)}`,
            accessToken,
          );
          spotifyArtistId = search.artists?.items?.[0]?.id ?? null;
          if (spotifyArtistId) {
            await supabase.from('artists').update({ spotify_artist_id: spotifyArtistId }).eq('id', artist.id);
          }
        }

        if (!spotifyArtistId) {
          skippedArtists.push(artist.name);
          continue;
        }

        const tracks = await getArtistTracks(spotifyArtistId, artist.name, accessToken);
        if (tracks.length === 0) {
          skippedArtists.push(artist.name);
          continue;
        }

        matchedArtists += 1;
        trackUris.push(...tracks);
      } catch {
        skippedArtists.push(artist.name);
      }
    }

    if (trackUris.length === 0) throw new Error('No tracks matched on Spotify for this lineup');

    // Resolve the curator's Spotify user id from the live token instead of
    // trusting the stored one — if they ever diverge (account switch, stale
    // row), creating under the stored id is a guaranteed 403.
    const me = await getSpotifyProfile(accessToken);
    if (me.id !== connection.spotify_user_id) {
      await supabase
        .from('spotify_connections')
        .update({ spotify_user_id: me.id })
        .eq('user_id', CURATOR_USER_ID);
    }

    const playlistName = `${festival.name} ${edition.year}`;
    const playlistBody = JSON.stringify({
      name: playlistName,
      description: `Shared Mainstage playlist for the ${festival.name} ${edition.year} lineup.`,
      public: true,
    });

    // Some dev-mode app configurations 403 on /users/{id}/playlists while
    // accepting the equivalent /me/playlists — try both before giving up.
    // If both fail, surface everything needed to diagnose from a screenshot
    // (account id + actually-granted scopes) instead of a bare "Forbidden".
    let playlist;
    try {
      playlist = await spotifyFetch(`/users/${encodeURIComponent(me.id)}/playlists`, accessToken, {
        method: 'POST',
        body: playlistBody,
      });
    } catch {
      try {
        playlist = await spotifyFetch('/me/playlists', accessToken, {
          method: 'POST',
          body: playlistBody,
        });
      } catch (creationError) {
        throw new Error(
          `Spotify refused to create the playlist. Curator account: ${me.id}, granted scopes: ${
            refreshed.scope ?? 'unknown'
          }. Underlying error: ${(creationError as Error).message}`,
        );
      }
    }

    // Spotify caps "add items" at 100 URIs per request.
    for (let i = 0; i < trackUris.length; i += 100) {
      await spotifyFetch(`/playlists/${playlist.id}/tracks`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ uris: trackUris.slice(i, i + 100) }),
      });
    }

    const row: CachedPlaylistRow = {
      spotify_playlist_id: playlist.id,
      spotify_playlist_url: playlist.external_urls.spotify,
      total_artists: lineup.length,
      matched_artists: matchedArtists,
      total_tracks: trackUris.length,
      skipped_artists: skippedArtists,
    };

    // Race-safe cache write: two users requesting the same never-before-seen
    // edition at once can both reach this point and both create a Spotify
    // playlist — the unique constraint on edition_id lets only one insert
    // win. Whoever loses the race re-reads and serves the winner's row
    // instead of surfacing their own (now-orphaned) playlist to the user.
    const { data: inserted, error: insertError } = await supabase
      .from('festival_playlists')
      .insert({ festival_id: festivalId, edition_id: editionId, ...row })
      .select()
      .single();

    if (insertError) {
      const { data: raceWinner, error: raceError } = await supabase
        .from('festival_playlists')
        .select('*')
        .eq('edition_id', editionId)
        .single();
      if (raceError || !raceWinner) throw insertError;
      return respondFromCache(raceWinner as CachedPlaylistRow);
    }

    return respondFromCache(inserted as CachedPlaylistRow);
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
