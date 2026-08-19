import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radii, spacing, typography } from '@/theme';

interface ReportBlockSheetProps {
  visible: boolean;
  authorName: string;
  onReport: () => void;
  onBlock: () => void;
  onClose: () => void;
}

/** Report/block menu for a review's author — same two actions the native
 *  Alert used to offer, styled to match the rest of the app instead of
 *  looking like a bare system popup. */
export function ReportBlockSheet({
  visible,
  authorName,
  onReport,
  onBlock,
  onClose,
}: ReportBlockSheetProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{authorName}</Text>

        <Pressable
          style={styles.option}
          onPress={() => {
            onClose();
            onReport();
          }}
        >
          <Ionicons name="flag-outline" size={20} color={colors.text} />
          <Text style={styles.optionLabel}>{t('report.review')}</Text>
        </Pressable>

        <Pressable
          style={styles.option}
          onPress={() => {
            onClose();
            onBlock();
          }}
        >
          <Ionicons name="ban-outline" size={20} color={colors.danger} />
          <Text style={[styles.optionLabel, styles.optionLabelDanger]}>
            {t('report.block', { name: authorName })}
          </Text>
        </Pressable>

        <Pressable style={styles.cancel} onPress={onClose}>
          <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
        </Pressable>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  title: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  optionLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  optionLabelDanger: { color: colors.danger },
  cancel: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  cancelLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
});
