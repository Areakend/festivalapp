import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radii, spacing, typography } from '@/theme';
import type { WritableCalendar } from '@/lib/calendar';

interface CalendarPickerSheetProps {
  visible: boolean;
  calendars: WritableCalendar[];
  onSelect: (calendar: WritableCalendar) => void;
  onClose: () => void;
}

/** Android only — picks which of the device's writable calendars (Google,
 *  a manufacturer's own account, a local one...) an event should be added
 *  to, since expo-calendar has no equivalent to iOS's single OS-level
 *  default and silently picking the first one found isn't reliable. */
export function CalendarPickerSheet({ visible, calendars, onSelect, onClose }: CalendarPickerSheetProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('festival.pickCalendar')}</Text>
        <ScrollView style={styles.list}>
          {calendars.map((cal) => (
            <Pressable key={cal.id} style={styles.option} onPress={() => onSelect(cal)}>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{cal.title}</Text>
                {!!cal.source && <Text style={styles.optionSource}>{cal.source}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
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
    maxHeight: '65%',
    paddingBottom: spacing.xxl,
  },
  title: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
    padding: spacing.xl,
    paddingBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.md },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  optionText: { flex: 1, gap: 1 },
  optionTitle: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  optionSource: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
