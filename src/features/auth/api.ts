import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

// Required so the auth browser session closes correctly on iOS.
WebBrowser.maybeCompleteAuthSession();

const redirectTo = Linking.createURL('auth/callback'); // festiq://auth/callback

/**
 * All password handling is delegated to Supabase Auth (bcrypt server-side).
 * The app only ever holds the resulting session JWT, stored in SecureStore.
 */

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
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
 * Google sign-in via Supabase OAuth + PKCE:
 * open the provider page in a secure browser session, then exchange the
 * returned `code` for a session. No client secret involved on-device.
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return; // user cancelled — not an error

  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('No auth code returned from provider');

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}
