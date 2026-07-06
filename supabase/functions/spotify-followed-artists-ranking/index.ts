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

/** All artists the user follows, paginated via Spotify's cursor-based /me/following. */
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

    // Always refresh: it's the only place Spotify reports granted scopes,
    // and a connection made before user-follow-read existed won't have it.
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

    if (followedIds.length === 0) {
      return new Response(JSON.stringify({ ranking: [], followedCount: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Walk artists -> edition_artists -> festival_editions -> festivals so a
    // festival matches if ANY of its editions (any year) booked a followed
    // artist — counted once per artist even if they played multiple years.
    //
    // Two passes: most lineup artists have never been through
    // generate-playlist's lazy Spotify-ID resolution, so an id-only match
    // would miss almost everything. Pass 1 matches by id (fast, exact);
    // pass 2 falls back to a case-insensitive name match for artists still
    // missing a spotify_artist_id.
    const SELECT =
      'id, name, spotify_artist_id, edition_artists(festival_editions(festivals(id, name, slug)))';

    const [byId, unresolved] = await Promise.all([
      supabase.from('artists').select(SELECT).in('spotify_artist_id', followedIds),
      supabase.from('artists').select(SELECT).is('spotify_artist_id', null),
    ]);
    if (byId.error) throw byId.error;
    if (unresolved.error) throw unresolved.error;

    const followedNameSet = new Set(followed.map((a) => a.name.toLowerCase()));
    const rows = [
      ...(byId.data ?? []),
      ...(unresolved.data ?? []).filter((a) => followedNameSet.has((a.name as string).toLowerCase())),
    ];

    interface FestivalMatch {
      festivalId: string;
      festivalName: string;
      festivalSlug: string;
      artistIds: Set<string>;
      artistNames: string[];
    }
    const byFestival = new Map<string, FestivalMatch>();

    for (const artist of (rows ?? []) as unknown as {
      id: string;
      name: string;
      edition_artists: { festival_editions: { festivals: { id: string; name: string; slug: string } } }[];
    }[]) {
      const festivalsForArtist = new Set(
        artist.edition_artists.map((ea) => ea.festival_editions.festivals),
      );
      for (const festival of festivalsForArtist) {
        let match = byFestival.get(festival.id);
        if (!match) {
          match = {
            festivalId: festival.id,
            festivalName: festival.name,
            festivalSlug: festival.slug,
            artistIds: new Set(),
            artistNames: [],
          };
          byFestival.set(festival.id, match);
        }
        if (!match.artistIds.has(artist.id)) {
          match.artistIds.add(artist.id);
          match.artistNames.push(artist.name);
        }
      }
    }

    const ranking = [...byFestival.values()]
      .map((m) => ({
        festivalId: m.festivalId,
        festivalName: m.festivalName,
        festivalSlug: m.festivalSlug,
        matchedCount: m.artistIds.size,
        matchedArtists: m.artistNames,
      }))
      .sort((a, b) => b.matchedCount - a.matchedCount);

    return new Response(JSON.stringify({ ranking, followedCount: followed.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
