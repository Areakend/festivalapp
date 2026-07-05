import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

interface SessionState {
  session: Session | null;
  /** false until the initial session restore from SecureStore has completed */
  initialized: boolean;
}

export const useSessionStore = create<SessionState>(() => ({
  session: null,
  initialized: false,
}));

/**
 * Wire the Supabase auth listener into the store.
 * Called exactly once from the root layout.
 *
 * A hung getSession() call (bad network, blocked host) would otherwise leave
 * `initialized` false forever, and the root layout's `if (!ready) return null`
 * would keep the app on the splash screen indefinitely with no way out — so
 * this falls back to "no session" after 8s instead of waiting forever. The
 * user lands on the sign-in screen, which is recoverable; an infinite splash
 * is not.
 */
export function initSessionListener() {
  const fallback = setTimeout(() => {
    useSessionStore.setState((s) => (s.initialized ? s : { session: null, initialized: true }));
  }, 8_000);

  supabase.auth.getSession().then(({ data }) => {
    clearTimeout(fallback);
    useSessionStore.setState({ session: data.session, initialized: true });
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    clearTimeout(fallback);
    useSessionStore.setState({ session, initialized: true });
  });
}
