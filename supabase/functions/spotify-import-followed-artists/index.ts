import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { refreshAccessToken } from '../_shared/spotify.ts';

const MAX_PAGES = 20; // 20 * 50 = up to 1000 followed artists, well beyond any real account

async function spotifyFetch(path: string, accessToken: string) {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Spotify API ${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function getAllFollowedArtists(accessToken: string): Promise<{ id: string; name: string }[]> {
  const artists: { id: string; name: string }[] = [];
  let after: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const query = after ? `&after=${encodeURIComponent(after)}` : '';
    const data = await spotifyFetch(`/me/following?type=artist&limit=50${query}`, accessToken);
    const items = data.artists?.items ?? [];
    for (const a of items) artists.push({ id: a.id, name: a.name });
    after = data.artists?.cursors?.after;
    if (!after || items.length === 0) break;
  }
  return artists;
}

/**
 * One-time seed for the in-app follow list: pulls everything the user
 * follows on Spotify and, for whichever of those artists already exist in
 * our catalog (id match, falling back to a case-insensitive name match for
 * artists never resolved to a Spotify id yet), adds them to artist_follows.
 * Artists that don't play any festival in the catalog are skipped — nothing
 * useful to rank them against.
 */
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

    const { data: connection, error: connError } = await supabase
      .from('spotify_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (connError || !connection) throw new Error('Spotify not connected');

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

    if (refreshed.scope && !refreshed.scope.includes('user-follow-read')) {
      throw new Error(
        'Your Spotify connection is missing the "follow" permission. Disconnect Spotify in your profile, connect it again, and retry.',
      );
    }

    const followed = await getAllFollowedArtists(accessToken);
    const followedIds = followed.map((a) => a.id);
    const followedNameSet = new Set(followed.map((a) => a.name.toLowerCase()));

    let matched: { id: string }[] = [];
    if (followedIds.length > 0) {
      const [byId, unresolved] = await Promise.all([
        supabase.from('artists').select('id').in('spotify_artist_id', followedIds),
        supabase.from('artists').select('id, name').is('spotify_artist_id', null),
      ]);
      if (byId.error) throw byId.error;
      if (unresolved.error) throw unresolved.error;

      matched = [
        ...(byId.data ?? []),
        ...(unresolved.data ?? []).filter((a) => followedNameSet.has((a.name as string).toLowerCase())),
      ];
    }

    if (matched.length > 0) {
      const { error: insertError } = await supabase
        .from('artist_follows')
        .upsert(
          matched.map((a) => ({ user_id: user.id, artist_id: a.id })),
          { onConflict: 'user_id,artist_id', ignoreDuplicates: true },
        );
      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ importedCount: matched.length, followedCount: followed.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
