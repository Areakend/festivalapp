import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Button } from '@/components/ui/Button';
import { colors, radii, spacing, typography } from '@/theme';

interface DateRangeSheetProps {
  visible: boolean;
  from: Date;
  to: Date;
  onApply: (from: Date, to: Date) => void;
  onClose: () => void;
}

/** Bottom-sheet custom date-range picker, for the Festivals period filter. */
export function DateRangeSheet({ visible, from, to, onApply, onClose }: DateRangeSheetProps) {
  const { t } = useTranslation();
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);

  const apply = () => {
    const [lo, hi] = draftFrom <= draftTo ? [draftFrom, draftTo] : [draftTo, draftFrom];
    onApply(lo, hi);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('discover.periodCustom')}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>{t('discover.periodFrom')}</Text>
          <DateTimePicker
            value={draftFrom}
            mode="date"
            display={Platform.OS === 'ios' ? 'compact' : 'default'}
            onChange={(_, date) => date && setDraftFrom(date)}
            themeVariant="dark"
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('discover.periodTo')}</Text>
          <DateTimePicker
            value={draftTo}
            mode="date"
            display={Platform.OS === 'ios' ? 'compact' : 'default'}
            onChange={(_, date) => date && setDraftTo(date)}
            themeVariant="dark"
          />
        </View>

        <Button label={t('common.done')} onPress={apply} />
        <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
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
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
});
