import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { refreshAccessToken } from '../_shared/spotify.ts';

async function spotifyFetch(path: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init?.headers },
  });
  if (!res.ok) throw new Error(`Spotify API ${path} failed (${res.status}): ${await res.text()}`);
  // PUT /me/following returns an empty 204 body — nothing to parse.
  return res.status === 204 ? null : res.json();
}

/** Follows an artist on the user's Spotify account from a tap on a lineup chip. */
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

    const { artistId } = await req.json();
    if (!artistId) throw new Error('Missing artistId');

    const { data: connection, error: connError } = await supabase
      .from('spotify_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (connError || !connection) throw new Error('Spotify not connected');

    // Always refresh: the refresh response is the only place Spotify reports
    // the granted scopes, needed to give a clear message when a connection
    // predates user-follow-modify instead of a bare 403.
    const refreshed = await refreshAccessToken(connection.refresh_token);
    const accessToken = refreshed.access_token;
    await supabase
      .from('spotify_connections')
      .update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      })
      .eq('user_id', user.id);

    if (refreshed.scope && !refreshed.scope.includes('user-follow-modify')) {
      throw new Error(
        'Your Spotify connection is missing the "follow" permission. Disconnect Spotify in your profile, connect it again, and retry.',
      );
    }

    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, name, spotify_artist_id')
      .eq('id', artistId)
      .single();
    if (artistError || !artist) throw new Error('Artist not found');

    let spotifyArtistId = artist.spotify_artist_id as string | null;
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
    if (!spotifyArtistId) throw new Error(`Couldn't find "${artist.name}" on Spotify`);

    await spotifyFetch(`/me/following?type=artist&ids=${spotifyArtistId}`, accessToken, {
      method: 'PUT',
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
