/**
 * Deezer's catalog endpoints (search, artist top tracks) are public and need
 * no app registration or OAuth — only writing to a user's library would,
 * which is why this only covers read-only lookups used for the universal
 * export (see generate-playlist-export).
 */
async function deezerFetch<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.deezer.com${path}`);
  const body = await res.json();
  if (body?.error) throw new Error(`Deezer API ${path} failed: ${body.error.message ?? JSON.stringify(body.error)}`);
  return body as T;
}

export function searchDeezerArtist(name: string) {
  return deezerFetch<{ data: { id: number }[] }>(`/search/artist?q=${encodeURIComponent(name)}&limit=1`);
}

export function getDeezerArtistTopTracks(artistId: string, limit: number) {
  return deezerFetch<{ data: { id: number; title: string }[] }>(`/artist/${artistId}/top?limit=${limit}`);
}
