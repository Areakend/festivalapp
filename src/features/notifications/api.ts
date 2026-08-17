import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';

// Without an explicit handler, a notification that arrives while the app is
// open never shows a banner — it'd otherwise look like pushes silently do
// nothing unless the app is backgrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registers this device's Expo push token for the signed-in user, once per
 * app session. Best-effort: permission denial, simulators, and missing
 * projectId all fail the token fetch — none of that should block using the
 * app, so every failure is swallowed rather than surfaced.
 */
export function useRegisterPushToken() {
  const userId = useSessionStore((s) => s.session?.user.id);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (status !== 'granted') {
          ({ status } = await Notifications.requestPermissionsAsync());
        }
        if (status !== 'granted') return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) return;

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        await supabase.from('push_tokens').upsert(
          { user_id: userId, token },
          { onConflict: 'user_id,token' },
        );
      } catch {
        // Simulator, permission denial, offline — never block app usage.
      }
    })();
  }, [userId]);
}
