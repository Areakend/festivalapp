import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { colors, radii, spacing, typography } from '@/theme';

interface AttendanceYearSheetProps {
  visible: boolean;
  /** Years already recorded — shown disabled so they can't be added twice. */
  recordedYears: number[];
  /** Earliest selectable year (defaults to festival.first_year, or 30 years back). */
  fromYear: number;
  onSelect: (year: number) => void;
  onClose: () => void;
}

/** Bottom-sheet year picker for logging which edition(s) of a festival you attended. */
export function AttendanceYearSheet({
  visible,
  recordedYears,
  fromYear,
  onSelect,
  onClose,
}: AttendanceYearSheetProps) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - fromYear + 1 }, (_, i) => currentYear - i);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('festival.pickAttendedYear')}</Text>
        <ScrollView contentContainerStyle={styles.grid}>
          {years.map((year) => (
            <Chip
              key={year}
              label={String(year)}
              onPress={recordedYears.includes(year) ? undefined : () => onSelect(year)}
              activeColor={colors.statusAttended}
              active={recordedYears.includes(year)}
            />
          ))}
        </ScrollView>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
