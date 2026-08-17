import { ReactNode, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Chip } from '@/components/ui/Chip';
import {
  generateCustomItemKey,
  useChecklistItems,
  useRemoveChecklistItem,
  useSetChecklistItem,
} from '@/features/checklist/api';
import {
  BASE_ITEMS,
  MULTI_DAY_ITEMS,
  TOGGLE_ITEMS,
  defaultSunny,
  isMultiDayEdition,
  togglePrefKey,
  type ChecklistItemDef,
  type ChecklistToggle,
} from '@/features/checklist/catalog';
import { useFestivalDetail } from '@/features/festivals/api';
import type { ChecklistItemRow } from '@/types/domain';
import { colors, radii, spacing, typography } from '@/theme';

// Emoji baked into each translated label doubles as the toggle's icon —
// Chip is text-only, no separate icon slot.
const TOGGLES: { key: ChecklistToggle; labelKey: string }[] = [
  { key: 'sunny', labelKey: 'checklist.toggleSunny' },
  { key: 'beach', labelKey: 'checklist.toggleBeach' },
  { key: 'camping', labelKey: 'checklist.toggleCamping' },
  { key: 'winter', labelKey: 'checklist.toggleWinter' },
  { key: 'abroad', labelKey: 'checklist.toggleAbroad' },
];

/**
 * Festival packing checklist: a fixed base list plus sections that show up
 * only when relevant — context toggles (sunny/beach/camping) the user sets
 * themselves, and a multi-day section shown automatically when the edition
 * spans more than one day. Checked state (and each toggle's own on/off
 * value) is saved per user+festival so it survives app restarts.
 */
export default function ChecklistScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data } = useFestivalDetail(slug);
  const { data: items } = useChecklistItems(data?.festival.id);
  const setItem = useSetChecklistItem();
  const removeItem = useRemoveChecklistItem();
  const [newItemText, setNewItemText] = useState('');

  const byKey = useMemo(() => new Map((items ?? []).map((i) => [i.item_key, i])), [items]);

  const multiDay = useMemo(() => {
    if (!data) return false;
    // Editions come back year-descending, so the soonest upcoming one needs
    // its own ascending sort rather than just taking the first match.
    const today = new Date().toISOString().slice(0, 10);
    const dated = data.editions.filter((e): e is typeof e & { start_date: string } => !!e.start_date);
    const upcoming =
      [...dated].filter((e) => e.start_date >= today).sort((a, b) => a.start_date.localeCompare(b.start_date))[0] ??
      dated[0];
    return upcoming ? isMultiDayEdition(upcoming.start_date, upcoming.end_date) : false;
  }, [data]);

  const isToggleOn = (toggle: ChecklistToggle): boolean => {
    const pref = byKey.get(togglePrefKey(toggle));
    if (pref) return pref.is_checked;
    return toggle === 'sunny' && !!data && defaultSunny(data.festival.country);
  };

  const toggleContext = (toggle: ChecklistToggle) => {
    if (!data) return;
    setItem.mutate({
      festivalId: data.festival.id,
      itemKey: togglePrefKey(toggle),
      label: togglePrefKey(toggle),
      isChecked: !isToggleOn(toggle),
    });
  };

  const toggleItemChecked = (item: ChecklistItemDef) => {
    if (!data) return;
    const current = byKey.get(item.key);
    setItem.mutate({
      festivalId: data.festival.id,
      itemKey: item.key,
      label: item.key,
      isChecked: !(current?.is_checked ?? false),
    });
  };

  const toggleCustomChecked = (row: ChecklistItemRow) => {
    if (!data) return;
    setItem.mutate({
      festivalId: data.festival.id,
      itemKey: row.item_key,
      label: row.label,
      isChecked: !row.is_checked,
      isCustom: true,
    });
  };

  const addCustomItem = () => {
    const label = newItemText.trim();
    if (!label || !data) return;
    setItem.mutate({
      festivalId: data.festival.id,
      itemKey: generateCustomItemKey(),
      label,
      isChecked: false,
      isCustom: true,
    });
    setNewItemText('');
  };

  const removeCustomItem = (row: ChecklistItemRow) => {
    if (!data) return;
    removeItem.mutate({ festivalId: data.festival.id, itemKey: row.item_key });
  };

  const customItems = (items ?? []).filter((i) => i.is_custom);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + spacing.lg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {t('checklist.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      {data && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {data.festival.name}
        </Text>
      )}

      <View style={styles.toggleRow}>
        {TOGGLES.map(({ key, labelKey }) => (
          <Chip
            key={key}
            label={t(labelKey)}
            active={isToggleOn(key)}
            activeColor={colors.statusPlanned}
            onPress={() => toggleContext(key)}
          />
        ))}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Section title={t('checklist.sectionBase')}>
          {BASE_ITEMS.map((item) => (
            <ItemRow
              key={item.key}
              label={t(item.labelKey)}
              checked={byKey.get(item.key)?.is_checked ?? false}
              onPress={() => toggleItemChecked(item)}
            />
          ))}
        </Section>

        {multiDay && (
          <Section title={t('checklist.sectionMultiDay')}>
            {MULTI_DAY_ITEMS.map((item) => (
              <ItemRow
                key={item.key}
                label={t(item.labelKey)}
                checked={byKey.get(item.key)?.is_checked ?? false}
                onPress={() => toggleItemChecked(item)}
              />
            ))}
          </Section>
        )}

        {TOGGLES.filter(({ key }) => isToggleOn(key)).map(({ key, labelKey }) => (
          <Section key={key} title={t(labelKey)}>
            {TOGGLE_ITEMS[key].map((item) => (
              <ItemRow
                key={item.key}
                label={t(item.labelKey)}
                checked={byKey.get(item.key)?.is_checked ?? false}
                onPress={() => toggleItemChecked(item)}
              />
            ))}
          </Section>
        ))}

        <Section title={t('checklist.sectionCustom')}>
          {customItems.map((row) => (
            <ItemRow
              key={row.item_key}
              label={row.label}
              checked={row.is_checked}
              onPress={() => toggleCustomChecked(row)}
              onRemove={() => removeCustomItem(row)}
            />
          ))}
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder={t('checklist.addPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={addCustomItem}
              returnKeyType="done"
            />
            <Pressable onPress={addCustomItem} hitSlop={10} disabled={!newItemText.trim()}>
              <Ionicons
                name="add-circle"
                size={28}
                color={newItemText.trim() ? colors.primary : colors.textMuted}
              />
            </Pressable>
          </View>
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function ItemRow({
  label,
  checked,
  onPress,
  onRemove,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  onRemove?: () => void;
}) {
  return (
    <Pressable style={styles.itemRow} onPress={onPress}>
      <Ionicons
        name={checked ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={checked ? colors.statusAttended : colors.textMuted}
      />
      <Text style={[styles.itemLabel, checked && styles.itemLabelChecked]}>{label}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={10}>
          <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: {
    flex: 1,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: { width: 24 },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  list: { flex: 1, marginTop: spacing.lg },
  listContent: { gap: spacing.lg, paddingBottom: spacing.xxl },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemLabel: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  itemLabelChecked: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  addInput: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
});
