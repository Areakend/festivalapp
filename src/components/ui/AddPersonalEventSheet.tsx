import { useState } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';
import { colors, radii, spacing, typography } from '@/theme';

interface AddPersonalEventSheetProps {
  visible: boolean;
  onSave: (input: { title: string; start_date: string; end_date: string | null }) => void;
  onClose: () => void;
}

type DateField = 'from' | 'to';

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Bottom-sheet form for a custom calendar entry — title + a date range,
 *  each date collapsed behind a "Du: 27 août 2026" row until tapped, so
 *  it never competes with the keyboard for space while typing the title. */
export function AddPersonalEventSheet({ visible, onSave, onClose }: AddPersonalEventSheetProps) {
  const { t, i18n } = useTranslation();
  const [title, setTitle] = useState('');
  const [from, setFrom] = useState(new Date());
  const [to, setTo] = useState(new Date());
  const [openField, setOpenField] = useState<DateField | null>(null);

  const reset = () => {
    setTitle('');
    setFrom(new Date());
    setTo(new Date());
    setOpenField(null);
  };

  const save = () => {
    if (!title.trim()) return;
    const [lo, hi] = from <= to ? [from, to] : [to, from];
    const startYmd = toYmd(lo);
    const endYmd = toYmd(hi);
    onSave({ title: title.trim(), start_date: startYmd, end_date: endYmd === startYmd ? null : endYmd });
    reset();
    onClose();
  };

  const dateField = (field: DateField, labelKey: string, value: Date, onChange: (d: Date) => void) => (
    <View>
      <Pressable
        style={styles.row}
        onPress={() => {
          Keyboard.dismiss();
          setOpenField((f) => (f === field ? null : field));
        }}
      >
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
        <Text style={styles.title}>{t('calendar.addEvent')}</Text>
        <TextField
          label={t('calendar.eventTitle')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('calendar.eventTitlePlaceholder')}
          onFocus={() => setOpenField(null)}
        />
        {dateField('from', 'discover.periodFrom', from, setFrom)}
        {dateField('to', 'discover.periodTo', to, setTo)}
        <Button label={t('common.save')} onPress={save} disabled={!title.trim()} />
        <Button
          label={t('common.cancel')}
          variant="ghost"
          onPress={() => {
            reset();
            onClose();
          }}
        />
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
