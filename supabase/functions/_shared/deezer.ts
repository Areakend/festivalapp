/**
 * Deezer's catalog endpoints (search, artist top tracks) are public and need
 * no app registration or OAuth — only writing to a user's library would,
 * which is why this only covers read-only lookups used for the universal
 * export (see generate-playlist-export).
 *
 * The public API caps out around 50 requests / 5s per IP. A large lineup
 * (100+ artists, each needing a search + a top-tracks call on the first
 * export before their deezer_artist_id is cached) blows past that in a
 * tight loop, so every call is throttled to stay under it, and a quota
 * error still gets a couple of backed-off retries rather than failing
 * outright.
 */
const MIN_INTERVAL_MS = 110;
let lastCallAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttle() {
  const wait = lastCallAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();
}

async function deezerFetch<T>(path: string, attempt = 0): Promise<T> {
  await throttle();
  const res = await fetch(`https://api.deezer.com${path}`);
  const body = await res.json();
  if (body?.error) {
    // Deezer's rate-limit error comes back as HTTP 200 with error.code 4
    // ("Quota limit exceeded"), not a 429 — check the body, not the status.
    const isQuotaError = body.error.code === 4 || /quota/i.test(body.error.message ?? '');
    if (isQuotaError && attempt < 3) {
      await sleep(1500 * (attempt + 1));
      return deezerFetch<T>(path, attempt + 1);
    }
    throw new Error(`Deezer API ${path} failed: ${body.error.message ?? JSON.stringify(body.error)}`);
  }
  return body as T;
}

export function searchDeezerArtist(name: string) {
  return deezerFetch<{ data: { id: number }[] }>(`/search/artist?q=${encodeURIComponent(name)}&limit=1`);
}

export function getDeezerArtistTopTracks(artistId: string, limit: number) {
  return deezerFetch<{ data: { id: number; title: string }[] }>(`/artist/${artistId}/top?limit=${limit}`);
}
