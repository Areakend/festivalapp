import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import {
  useAcceptFriendRequest,
  useFriendships,
  useRemoveFriendship,
  useSearchUsers,
  useSendFriendRequest,
  type PublicProfile,
} from '@/features/friends/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';

/** Friends hub: search users, handle requests, open friend profiles. */
export default function FriendsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const { data: friendships } = useFriendships();
  const { data: searchResults } = useSearchUsers(search);
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const removeFriendship = useRemoveFriendship();

  const pendingIds = new Set([
    ...(friendships?.outgoing ?? []).map((f) => f.profile.id),
    ...(friendships?.incoming ?? []).map((f) => f.profile.id),
    ...(friendships?.friends ?? []).map((f) => f.profile.id),
  ]);

  const confirmRemoveFriend = (friendshipId: string, name: string) => {
    Alert.alert(t('friends.remove'), name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('friends.remove'),
        style: 'destructive',
        onPress: () => removeFriendship.mutate(friendshipId),
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('friends.title')}</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder={t('friends.searchUsers')}
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />
      <View style={styles.listArea}>
        {(searchResults ?? []).map((user) => (
          <UserRow key={user.id} user={user}>
            {pendingIds.has(user.id) ? (
              <Text style={styles.pendingLabel}>{t('friends.requestSent')}</Text>
            ) : (
              <Button
                label={t('friends.add')}
                variant="secondary"
                onPress={() => sendRequest.mutate(user.id)}
                loading={sendRequest.isPending}
                style={styles.smallButton}
              />
            )}
          </UserRow>
        ))}

        {/* Incoming requests */}
        {(friendships?.incoming.length ?? 0) > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('friends.requests')}</Text>
            {friendships!.incoming.map(({ friendshipId, profile }) => (
              <UserRow key={friendshipId} user={profile}>
                <View style={styles.requestActions}>
                  <Button
                    label={t('friends.accept')}
                    onPress={() => acceptRequest.mutate(friendshipId)}
                    loading={acceptRequest.isPending}
                    style={styles.smallButton}
                  />
                  <Button
                    label={t('friends.decline')}
                    variant="ghost"
                    onPress={() => removeFriendship.mutate(friendshipId)}
                    loading={removeFriendship.isPending}
                    style={styles.smallButton}
                  />
                </View>
              </UserRow>
            ))}
          </>
        )}

        {/* Friends list */}
        <Text style={styles.sectionTitle}>{t('friends.title')}</Text>
        {(friendships?.friends.length ?? 0) === 0 ? (
          <Text style={styles.emptyText}>{t('friends.noFriends')}</Text>
        ) : (
          friendships!.friends.map(({ friendshipId, profile }) => (
            <Pressable
              key={friendshipId}
              onPress={() => router.push({ pathname: '/user/[id]', params: { id: profile.id } })}
            >
              <UserRow user={profile}>
                <Pressable
                  onPress={() => confirmRemoveFriend(friendshipId, profile.display_name)}
                  hitSlop={10}
                  style={styles.removeButton}
                >
                  <Ionicons name="person-remove-outline" size={18} color={colors.textMuted} />
                </Pressable>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </UserRow>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function UserRow({ user, children }: { user: PublicProfile; children?: React.ReactNode }) {
  return (
    <View style={styles.userRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLetter}>{user.display_name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.userName} numberOfLines={1}>
        {user.display_name} {user.country ? countryFlag(user.country) : ''}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xl,
  },
  listArea: { paddingHorizontal: spacing.xl },
  sectionTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.primary,
  },
  userName: {
    flex: 1,
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  smallButton: { minHeight: 40, paddingVertical: spacing.sm },
  removeButton: { padding: spacing.xs },
  pendingLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
