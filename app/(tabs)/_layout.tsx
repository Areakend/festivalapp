import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useMyInvites } from '@/features/invites/api';
import { colors, typography } from '@/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { data: invitesData } = useMyInvites();

  // React Navigation's own badge rendering (tabBarBadge) — undefined hides
  // it, so no "0" ever shows up on a clean tab.
  const pendingInvites =
    invitesData?.received.filter((i) => i.status === 'pending').length || undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: typography.fonts.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: t('tabs.festivals'),
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="artists"
        options={{
          title: t('artists.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" size={size} color={color} />
          ),
        }}
      />
      {/* Not shown as a bottom tab — reachable from the "Amis" button in
          Home's header instead, which frees up a tab and matches the fact
          that this is a secondary destination, not one of the app's main
          sections. Still a real route: Tabs.Screen (rather than moving the
          file out of this group) is what keeps deep links and
          router.push('/friends') working. */}
      <Tabs.Screen name="friends" options={{ href: null }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          tabBarBadge: pendingInvites,
        }}
      />
    </Tabs>
  );
}
