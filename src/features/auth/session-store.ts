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
 */
export function initSessionListener() {
  supabase.auth.getSession().then(({ data }) => {
    useSessionStore.setState({ session: data.session, initialized: true });
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    useSessionStore.setState({ session, initialized: true });
  });
}
