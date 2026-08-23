import { Alert, Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { useBlockUser, useMyBlockedUsers } from '@/features/moderation/api';
import { colors, radii, spacing, typography } from '@/theme';

export default function BlockedUsersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: blocked, isLoading } = useMyBlockedUsers();
  const blockUser = useBlockUser();

  const unblock = (userId: string, name: string) => {
    Alert.alert(t('moderation.unblockConfirmTitle'), name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('moderation.unblock'),
        onPress: () =>
          blockUser.mutate(
            { blockedId: userId, blocked: true },
            { onError: (error) => Alert.alert(t('common.error'), error.message) },
          ),
      },
    ]);
  };

  return (
    <Screen>
      <Text style={styles.title}>{t('moderation.blockedUsers')}</Text>

      {!isLoading && (blocked?.length ?? 0) === 0 && (
        <Text style={styles.empty}>{t('moderation.noBlockedUsers')}</Text>
      )}

      {(blocked?.length ?? 0) > 0 && (
        <View style={styles.card}>
          {blocked!.map(({ blockId, profile }) => (
            <View key={blockId} style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>{profile.display_name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {profile.display_name}
              </Text>
              <Pressable
                style={styles.unblockButton}
                onPress={() => unblock(profile.id, profile.display_name)}
              >
                <Text style={styles.unblockLabel}>{t('moderation.unblock')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Button label={t('common.done')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  empty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.primary,
  },
  name: {
    flex: 1,
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  unblockButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  unblockLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
});
