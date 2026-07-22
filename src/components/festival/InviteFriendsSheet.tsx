import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { useFriendships, type PublicProfile } from '@/features/friends/api';
import { useMyInvites, useSendFestivalInvite } from '@/features/invites/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';

interface InviteFriendsSheetProps {
  visible: boolean;
  festivalId: string;
  editionId: string;
  onClose: () => void;
}

/** Picks accepted friends to invite to a specific festival edition. Already-
 *  invited friends show as sent instead of being pickable again (the DB's
 *  unique constraint would reject a duplicate anyway — this just avoids the
 *  error). No push notification: the invite simply appears next time the
 *  friend opens the app. */
export function InviteFriendsSheet({ visible, festivalId, editionId, onClose }: InviteFriendsSheetProps) {
  const { t } = useTranslation();
  const { data: friendsData } = useFriendships();
  const { data: invitesData } = useMyInvites();
  const sendInvite = useSendFestivalInvite();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const alreadyInvited = new Set(
    (invitesData?.sent ?? [])
      .filter((i) => i.edition.id === editionId)
      .map((i) => i.otherProfile.id),
  );

  const invite = async (friend: PublicProfile) => {
    setSendingId(friend.id);
    try {
      await sendInvite.mutateAsync({ festivalId, editionId, inviteeId: friend.id });
    } catch (error) {
      Alert.alert(t('common.error'), (error as Error).message);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('invites.pickFriends')}</Text>
        <ScrollView style={styles.list}>
          {(friendsData?.friends ?? []).length === 0 ? (
            <Text style={styles.empty}>{t('invites.noFriends')}</Text>
          ) : (
            friendsData!.friends.map(({ profile }) => {
              const invited = alreadyInvited.has(profile.id);
              return (
                <View key={profile.id} style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarLetter}>{profile.display_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.name} numberOfLines={1}>
                    {profile.display_name} {profile.country ? countryFlag(profile.country) : ''}
                  </Text>
                  {invited ? (
                    <View style={styles.invitedBadge}>
                      <Ionicons name="checkmark" size={16} color={colors.success} />
                      <Text style={styles.invitedText}>{t('invites.sent')}</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.inviteButton}
                      onPress={() => void invite(profile)}
                      disabled={sendingId === profile.id}
                    >
                      <Text style={styles.inviteButtonText}>
                        {sendingId === profile.id ? t('common.loading') : t('invites.invite')}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
        <Button label={t('common.done')} variant="ghost" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000088' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '70%',
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  list: { gap: spacing.sm },
  empty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
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
  name: {
    flex: 1,
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  inviteButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  inviteButtonText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.xs,
    color: colors.background,
  },
  invitedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  invitedText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.success,
  },
});
