import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { useMyInvites, useRespondToInvite, type FestivalInvite } from '@/features/invites/api';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';

/** Incoming + outgoing festival invites. No push notifications yet — this
 *  screen is the only place invites surface, so it's the source of truth
 *  for "did anyone invite me anywhere". */
export default function InvitationsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data, isLoading } = useMyInvites();
  const respond = useRespondToInvite();

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }) : '';

  const respondTo = (invite: FestivalInvite, accept: boolean) => {
    respond.mutate(
      { inviteId: invite.id, accept },
      { onError: (error) => Alert.alert(t('common.error'), error.message) },
    );
  };

  const InviteRow = ({ invite, showActions }: { invite: FestivalInvite; showActions: boolean }) => (
    <Pressable
      style={styles.row}
      onPress={() =>
        router.push({ pathname: '/festival/[slug]', params: { slug: invite.festival.slug } })
      }
    >
      <View style={styles.rowBody}>
        <Text style={styles.festivalName} numberOfLines={1}>
          {invite.festival.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {t(showActions ? 'invites.from' : 'invites.to', { name: invite.otherProfile.display_name })}
          {invite.otherProfile.country ? ` ${countryFlag(invite.otherProfile.country)}` : ''}
          {invite.edition.start_date ? ` · ${formatDate(invite.edition.start_date)}` : ''}
        </Text>
      </View>
      {showActions && invite.status === 'pending' ? (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, styles.declineButton]}
            onPress={(e) => {
              e.stopPropagation();
              respondTo(invite, false);
            }}
          >
            <Ionicons name="close" size={18} color={colors.danger} />
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.acceptButton]}
            onPress={(e) => {
              e.stopPropagation();
              respondTo(invite, true);
            }}
          >
            <Ionicons name="checkmark" size={18} color={colors.success} />
          </Pressable>
        </View>
      ) : (
        <Text style={[styles.status, styles[`status_${invite.status}`]]}>
          {t(`invites.status_${invite.status}`)}
        </Text>
      )}
    </Pressable>
  );

  return (
    <Screen>
      <Text style={styles.title}>{t('invites.title')}</Text>

      {isLoading ? null : (
        <>
          <Text style={styles.sectionTitle}>{t('invites.received')}</Text>
          {(data?.received.length ?? 0) === 0 ? (
            <Text style={styles.empty}>{t('invites.noneReceived')}</Text>
          ) : (
            <View style={styles.card}>
              {data!.received.map((invite) => (
                <InviteRow key={invite.id} invite={invite} showActions />
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>{t('invites.sentSection')}</Text>
          {(data?.sent.length ?? 0) === 0 ? (
            <Text style={styles.empty}>{t('invites.noneSent')}</Text>
          ) : (
            <View style={styles.card}>
              {data!.sent.map((invite) => (
                <InviteRow key={invite.id} invite={invite} showActions={false} />
              ))}
            </View>
          )}
        </>
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
  sectionTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.sm,
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
  rowBody: { flex: 1, gap: 2 },
  festivalName: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  meta: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: { backgroundColor: `${colors.danger}1A` },
  acceptButton: { backgroundColor: `${colors.success}1A` },
  status: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
  },
  status_pending: { color: colors.textMuted },
  status_accepted: { color: colors.success },
  status_declined: { color: colors.danger },
});
