import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';
import { colors, radii, spacing, typography } from '@/theme';

interface DateRangeSheetProps {
  visible: boolean;
  from: Date;
  to: Date;
  onApply: (from: Date, to: Date) => void;
  onClose: () => void;
}

type DateField = 'from' | 'to';

/** Bottom-sheet custom date-range picker, for the Festivals period filter.
 *  Each date collapses behind a summary row until tapped — same pattern as
 *  AddPersonalEventSheet. */
export function DateRangeSheet({ visible, from, to, onApply, onClose }: DateRangeSheetProps) {
  const { t, i18n } = useTranslation();
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [openField, setOpenField] = useState<DateField | null>(null);

  const apply = () => {
    const [lo, hi] = draftFrom <= draftTo ? [draftFrom, draftTo] : [draftTo, draftFrom];
    onApply(lo, hi);
    onClose();
  };

  const dateField = (field: DateField, labelKey: string, value: Date, onChange: (d: Date) => void) => (
    <View>
      <Pressable style={styles.row} onPress={() => setOpenField((f) => (f === field ? null : field))}>
        <Text style={styles.label}>{t(labelKey)}</Text>
        <Text style={styles.dateValue}>
          {value.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </Pressable>
      {openField === field && (
        <InlineDatePicker
          value={value}
          onChange={(d) => {
            onChange(d);
            setOpenField(null);
          }}
          locale={i18n.language}
        />
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('discover.periodCustom')}</Text>

        {dateField('from', 'discover.periodFrom', draftFrom, setDraftFrom)}
        {dateField('to', 'discover.periodTo', draftTo, setDraftTo)}

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
  dateValue: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.primary,
  },
});
