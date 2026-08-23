import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useFriendships } from '@/features/friends/api';
import { useMyInvites } from '@/features/invites/api';
import { colors, typography } from '@/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { data: friendsData } = useFriendships();
  const { data: invitesData } = useMyInvites();

  // React Navigation's own badge rendering (tabBarBadge) — undefined hides
  // it, so no "0" ever shows up on a clean tab.
  const incomingFriendRequests = friendsData?.incoming.length || undefined;
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
      <Tabs.Screen
        name="friends"
        options={{
          title: t('friends.title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          tabBarBadge: incomingFriendRequests,
        }}
      />
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
