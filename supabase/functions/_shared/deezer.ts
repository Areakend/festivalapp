const DEEZER_APP_ID = Deno.env.get('DEEZER_APP_ID')!;
const DEEZER_APP_SECRET = Deno.env.get('DEEZER_APP_SECRET')!;

/**
 * Deezer's access_token.php doesn't consistently return JSON on error
 * (plain text like "wrong code" is common), so read as text first and
 * parse defensively rather than assuming res.json() will succeed.
 */
export async function exchangeCodeForToken(code: string): Promise<{ accessToken: string }> {
  const url = new URL('https://connect.deezer.com/oauth/access_token.php');
  url.searchParams.set('app_id', DEEZER_APP_ID);
  url.searchParams.set('secret', DEEZER_APP_SECRET);
  url.searchParams.set('code', code);
  url.searchParams.set('output', 'json');

  const res = await fetch(url);
  const text = await res.text();
  let body: { access_token?: string };
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Deezer token exchange failed: ${text}`);
  }
  if (!body.access_token) throw new Error(`Deezer token exchange failed: ${text}`);
  return { accessToken: body.access_token };
}

/** Deezer's JSON API returns HTTP 200 even on errors, embedding {error} in the body. */
async function deezerFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const url = new URL(`https://api.deezer.com${path}`);
  url.searchParams.set('access_token', accessToken);
  const res = await fetch(url, init);
  const body = await res.json();
  if (body?.error) throw new Error(`Deezer API ${path} failed: ${body.error.message ?? JSON.stringify(body.error)}`);
  return body as T;
}

export function getDeezerProfile(accessToken: string) {
  return deezerFetch<{ id: number }>('/user/me', accessToken);
}

export function searchDeezerArtist(name: string, accessToken: string) {
  return deezerFetch<{ data: { id: number }[] }>(`/search/artist?q=${encodeURIComponent(name)}&limit=1`, accessToken);
}

export function getDeezerArtistTopTracks(artistId: string, accessToken: string, limit: number) {
  return deezerFetch<{ data: { id: number }[] }>(`/artist/${artistId}/top?limit=${limit}`, accessToken);
}

export function createDeezerPlaylist(deezerUserId: string, title: string, accessToken: string) {
  return deezerFetch<{ id: number }>(`/user/${deezerUserId}/playlists?title=${encodeURIComponent(title)}`, accessToken, {
    method: 'POST',
  });
}

export function addTracksToDeezerPlaylist(playlistId: string, trackIds: string[], accessToken: string) {
  return deezerFetch<boolean>(`/playlist/${playlistId}/tracks?songs=${trackIds.join(',')}`, accessToken, {
    method: 'POST',
  });
}
