import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

import '@/i18n'; // side-effect: initializes i18next with device language
import { colors } from '@/theme';
import { initSessionListener, useSessionStore } from '@/features/auth/session-store';

SplashScreen.preventAutoHideAsync();
initSessionListener();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // catalog data changes rarely; avoid refetch spam
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { session, initialized } = useSessionStore();
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const ready = fontsLoaded && initialized;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          {/*
            Route guards: signed-in users get the tabs, others the auth flow.
            These come first so that whichever group is active always ends up
            first in the navigator's routeNames. When a guard flips (e.g. on
            login) React Navigation drops the now-invalid group from the
            stack's route history and, if nothing remains, falls back to
            routeNames[0] — if that were "auth/callback" below, every login
            would land the user on that bare spinner screen instead of the
            signed-in stack.
          */}
          <Stack.Protected guard={!!session}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="festival/[slug]" />
            <Stack.Screen name="review/[slug]" />
            <Stack.Screen name="playlist/[slug]" />
            <Stack.Screen name="friends" />
            <Stack.Screen name="user/[id]" />
            <Stack.Screen name="list/[status]" />
            {/* Reachable once signed in: lands the Spotify OAuth redirect. */}
            <Stack.Screen name="spotify/callback" />
          </Stack.Protected>
          <Stack.Protected guard={!session}>
            <Stack.Screen name="(auth)" />
            {/*
              Lands the Google OAuth redirect when Android delivers it to the
              router instead of resolving openAuthSessionAsync. Grouped under
              the same guard as (auth) so it benefits from the exact
              same auto-navigation the normal sign-in screen gets: once the
              code exchange sets the session, this guard flips, the group
              becomes invalid, and the stack falls back to (tabs) on its own
              — no manual router.replace() needed here.
            */}
            <Stack.Screen name="auth/callback" />
          </Stack.Protected>
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
