/**
 * Spotify Web API helpers shared by Edge Functions.
 * SPOTIFY_CLIENT_SECRET lives ONLY here (set via `supabase secrets set`) —
 * it never ships in the mobile app.
 */

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1';

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artistName: string;
}

/** App-only token (Client Credentials) — used for preview mode. */
export async function appToken(): Promise<string> {
  const id = Deno.env.get('SPOTIFY_CLIENT_ID')!;
  const secret = Deno.env.get('SPOTIFY_CLIENT_SECRET')!;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(`${id}:${secret}`),
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Spotify app token failed: ${await res.text()}`);
  return (await res.json()).access_token as string;
}

/** Refresh a user's access token (PKCE flow: client_id only, no secret). */
export async function refreshUserToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: Deno.env.get('SPOTIFY_CLIENT_ID')!,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Spotify token refresh failed: ${await res.text()}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

/**
 * Find an artist by name. Only confident matches are returned:
 * exact case-insensitive match, or first result containing the query.
 */
export async function searchArtist(
  token: string,
  name: string,
): Promise<{ id: string; name: string } | null> {
  const res = await fetch(`${API}/search?type=artist&limit=3&q=${encodeURIComponent(name)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  // deno-lint-ignore no-explicit-any
  const items: any[] = (await res.json()).artists?.items ?? [];
  const lower = name.toLowerCase();
  const exact = items.find((a) => a.name.toLowerCase() === lower);
  if (exact) return { id: exact.id, name: exact.name };
  const first = items[0];
  return first && first.name.toLowerCase().includes(lower)
    ? { id: first.id, name: first.name }
    : null;
}

export async function topTracks(
  token: string,
  artistId: string,
  market = 'US',
): Promise<SpotifyTrack[]> {
  const res = await fetch(`${API}/artists/${artistId}/top-tracks?market=${market}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  // deno-lint-ignore no-explicit-any
  return ((await res.json()).tracks ?? []).map((t: any) => ({
    id: t.id,
    uri: t.uri,
    name: t.name,
    artistName: t.artists?.[0]?.name ?? '',
  }));
}

export function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
    },
  });
}
