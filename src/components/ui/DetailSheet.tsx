import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radii, spacing, typography } from '@/theme';

export interface DetailSheetRow {
  key: string;
  leading?: string;
  label: string;
  value?: string;
}

interface DetailSheetProps {
  visible: boolean;
  title: string;
  rows: DetailSheetRow[];
  emptyLabel: string;
  onClose: () => void;
}

/** Generic bottom sheet listing rows — used to drill into a stat (all
 *  countries visited, all festivals rated, ...) instead of just a number. */
export function DetailSheet({ visible, title, rows, emptyLabel, onClose }: DetailSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {rows.length === 0 ? (
            <Text style={styles.empty}>{emptyLabel}</Text>
          ) : (
            rows.map((row) => (
              <View key={row.key} style={styles.row}>
                <Text style={styles.rowLabel} numberOfLines={1}>
                  {row.leading ? `${row.leading} ` : ''}
                  {row.label}
                </Text>
                {row.value != null && <Text style={styles.rowValue}>{row.value}</Text>}
              </View>
            ))
          )}
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
    maxHeight: '70%',
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  list: { paddingHorizontal: spacing.xl },
  listContent: { gap: spacing.xs, paddingBottom: spacing.md },
  empty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginRight: spacing.md,
  },
  rowValue: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
