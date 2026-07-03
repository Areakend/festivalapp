/**
 * Exchange a Spotify PKCE authorization code for tokens and store the
 * connection server-side. The app never sees or stores Spotify tokens.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

import { jsonResponse } from '../_shared/spotify.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return jsonResponse({}, 200);

  try {
    // Identify the signed-in Festiq user from their JWT.
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return jsonResponse({ error: 'unauthorized' }, 401);

    const { code, code_verifier, redirect_uri } = await req.json();
    if (!code || !code_verifier || !redirect_uri) {
      return jsonResponse({ error: 'missing code / code_verifier / redirect_uri' }, 400);
    }

    // PKCE exchange: client_id + verifier, no secret required.
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id: Deno.env.get('SPOTIFY_CLIENT_ID')!,
        code_verifier,
      }),
    });
    if (!tokenRes.ok) return jsonResponse({ error: await tokenRes.text() }, 400);
    const tokens = await tokenRes.json();

    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!meRes.ok) return jsonResponse({ error: 'failed to fetch Spotify profile' }, 400);
    const me = await meRes.json();

    // Store tokens with the service role (RLS blocks client writes on purpose).
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { error } = await admin.from('spotify_connections').upsert(
      {
        user_id: user.id,
        spotify_user_id: me.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (error) return jsonResponse({ error: error.message }, 500);

    return jsonResponse({ connected: true, spotify_user_id: me.id });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
