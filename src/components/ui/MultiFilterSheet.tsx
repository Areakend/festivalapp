import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { colors, radii, spacing, typography } from '@/theme';
import type { FilterOption } from '@/components/ui/FilterSheet';

interface MultiFilterSheetProps {
  visible: boolean;
  title: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  onClose: () => void;
}

/**
 * Bottom-sheet multi-choice picker — unlike FilterSheet, tapping an option
 * toggles it without closing the sheet, so several can be picked in one go.
 */
export function MultiFilterSheet({
  visible,
  title,
  options,
  selected,
  onChange,
  onClose,
}: MultiFilterSheetProps) {
  const { t } = useTranslation();

  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {selected.length > 0 && (
            <Pressable onPress={() => onChange([])} hitSlop={8}>
              <Text style={styles.clear}>{t('common.clear')}</Text>
            </Pressable>
          )}
        </View>
        <ScrollView style={styles.list}>
          {options.map((option) => {
            const active = selected.includes(option.value);
            return (
              <Pressable
                key={option.value}
                style={styles.option}
                onPress={() => toggle(option.value)}
              >
                <Text style={[styles.optionLabel, active && styles.optionActive]}>
                  {option.label}
                </Text>
                <Ionicons
                  name={active ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={active ? colors.primary : colors.textMuted}
                />
              </Pressable>
            );
          })}
        </ScrollView>
        <Button label={t('common.done')} onPress={onClose} style={styles.doneButton} />
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
    maxHeight: '75%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  clear: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.accent,
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
  optionLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  optionActive: {
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.primary,
  },
  doneButton: { marginHorizontal: spacing.xl, marginTop: spacing.md },
});
