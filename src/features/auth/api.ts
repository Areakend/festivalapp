import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

// Required so the auth browser session closes correctly on iOS.
WebBrowser.maybeCompleteAuthSession();

const redirectTo = Linking.createURL('auth/callback'); // festiq://auth/callback

/**
 * Without this, a hung request (bad network, blocked host, dead TLS
 * connection) leaves the caller's promise pending forever — the UI shows an
 * infinite spinner with no way to tell what's wrong. Race it against a timer
 * so there's always a message to show.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s — check your connection.`)), ms),
    ),
  ]);
}

/**
 * All password handling is delegated to Supabase Auth (bcrypt server-side).
 * The app only ever holds the resulting session JWT, stored in SecureStore.
 */

export async function signInWithEmail(email: string, password: string) {
  const { error } = await withTimeout(
    supabase.auth.signInWithPassword({ email, password }),
    15_000,
    'Sign in',
  );
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  // TODO(phase 2): deep-link "set new password" screen; for now Supabase's
  // hosted recovery page handles the update.
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Same Android quirk as the Spotify connect flow (see spotify/api.ts): the
 * OS can deliver the festiq://auth/callback redirect to the router (the
 * auth/callback screen) instead of resolving openAuthSessionAsync — which
 * then hangs forever and the sign-in never completes. Whichever side claims
 * this flag first exchanges the code; the loser stands down, so the
 * single-use authorization code is never sent to Supabase twice. The PKCE
 * code verifier itself lives in supabase-js's storage, so either side can
 * perform the exchange.
 */
let pendingGoogleAuth = false;

function claimPendingGoogleAuth() {
  const claimed = pendingGoogleAuth;
  pendingGoogleAuth = false;
  return claimed;
}

/**
 * Always attempts the exchange (the PKCE verifier lives in supabase-js's
 * storage, so this works even if Android restarted the process to deliver
 * the deep link and the in-memory flag was lost). The claim only decides
 * whether a failure is worth surfacing: with no claim, an error usually
 * just means the browser-session path already consumed the code.
 */
export async function completeGoogleAuthFromDeepLink(
  code: string,
): Promise<{ error?: string }> {
  const claimed = claimPendingGoogleAuth();
  try {
    const { error } = await withTimeout(
      supabase.auth.exchangeCodeForSession(code),
      15_000,
      'Completing Google sign-in',
    );
    if (error) throw error;
    return {};
  } catch (error) {
    return { error: claimed ? (error as Error).message : undefined };
  }
}

/**
 * Google sign-in via Supabase OAuth + PKCE:
 * open the provider page in a secure browser session, then exchange the
 * returned `code` for a session. No client secret involved on-device.
 */
export async function signInWithGoogle() {
  const { data, error } = await withTimeout(
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    }),
    15_000,
    'Getting the Google sign-in URL',
  );
  if (error) throw error;

  pendingGoogleAuth = true;

  // No timeout here: the user is looking at a browser tab, not a spinner —
  // this one is meant to hang until they act (or cancel) on it.
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    // On the racy devices this promise reports cancel/dismiss while the
    // redirect actually went to the router, where the callback screen will
    // claim the flag and finish the exchange — so leave the claim in place.
    // If the user genuinely cancelled, a stale claim is harmless: it's
    // simply re-armed on the next attempt.
    return;
  }

  // The callback screen may have claimed and exchanged this code already.
  if (!claimPendingGoogleAuth()) return;

  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('No auth code returned from provider');

  const { error: exchangeError } = await withTimeout(
    supabase.auth.exchangeCodeForSession(code),
    15_000,
    'Completing Google sign-in',
  );
  if (exchangeError) throw exchangeError;
}
