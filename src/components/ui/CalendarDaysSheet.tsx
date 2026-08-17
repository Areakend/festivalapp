import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { colors, radii, spacing, typography } from '@/theme';

interface CalendarDaysSheetProps {
  visible: boolean;
  /** YYYY-MM-DD, inclusive range. */
  startDate: string;
  endDate: string;
  locale: string;
  onExport: (selectedDates: string[]) => void;
  onClose: () => void;
}

export function eachDay(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const last = new Date(`${endDate}T00:00:00Z`);
  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Bottom-sheet day picker: pick which specific day(s) of a multi-day festival to add to the calendar. */
export function CalendarDaysSheet({
  visible,
  startDate,
  endDate,
  locale,
  onExport,
  onClose,
}: CalendarDaysSheetProps) {
  const { t } = useTranslation();
  const days = eachDay(startDate, endDate);
  const [selected, setSelected] = useState<string[]>(days);

  const toggle = (day: string) =>
    setSelected((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const formatDay = (day: string, index: number) =>
    `${t('festival.dayNumber', { count: index + 1 })} · ${new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('festival.pickCalendarDays')}</Text>
        <ScrollView contentContainerStyle={styles.list}>
          {days.map((day, index) => (
            <Chip
              key={day}
              label={formatDay(day, index)}
              active={selected.includes(day)}
              onPress={() => toggle(day)}
            />
          ))}
        </ScrollView>
        <Button
          label={t('festival.addToCalendar')}
          onPress={() => onExport(selected)}
          disabled={selected.length === 0}
        />
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
    maxHeight: '70%',
  },
  title: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  list: { gap: spacing.sm },
});
