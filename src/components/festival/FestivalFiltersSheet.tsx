import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';
import { colors, radii, spacing, typography } from '@/theme';

/** 'custom' needs a date range (customRange below); the others are fixed
 *  windows from today, computed by the screen that owns the actual
 *  filtering logic. */
export type PeriodKey = 'all' | 'upcoming' | '3m' | '6m' | 'custom';

export interface FilterOption {
  value: string;
  label: string;
  /** Extra text matched against a search query but never shown — lets
   *  "France" find 🇫🇷 FR without cluttering the chip with the full name. */
  searchText?: string;
}

interface FestivalFiltersSheetProps {
  visible: boolean;
  locale: string;
  genreOptions: FilterOption[];
  genres: string[];
  onChangeGenres: (values: string[]) => void;
  countryOptions: FilterOption[];
  countries: string[];
  onChangeCountries: (values: string[]) => void;
  period: PeriodKey;
  periodLabels: Record<Exclude<PeriodKey, 'custom'>, string>;
  customRange: { from: Date; to: Date } | null;
  onChangePeriod: (period: PeriodKey) => void;
  onChangeCustomRange: (from: Date, to: Date) => void;
  onClose: () => void;
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function matches(option: FilterOption, query: string): boolean {
  if (!query) return true;
  const haystack = `${option.label} ${option.searchText ?? ''}`.toLowerCase();
  return haystack.includes(query);
}

/**
 * Genres + Pays + Période in one sheet instead of three separate chips —
 * each opened its own full-screen sheet for what's really one filtering
 * step. Genres/Pays get their own search box since scrolling a long list
 * to find one entry doesn't scale.
 */
export function FestivalFiltersSheet({
  visible,
  locale,
  genreOptions,
  genres,
  onChangeGenres,
  countryOptions,
  countries,
  onChangeCountries,
  period,
  periodLabels,
  customRange,
  onChangePeriod,
  onChangeCustomRange,
  onClose,
}: FestivalFiltersSheetProps) {
  const { t } = useTranslation();
  const [genreQuery, setGenreQuery] = useState('');
  const [countryQuery, setCountryQuery] = useState('');
  // Collapsed behind a "Du : 27 août 2026" row until tapped — two
  // side-by-side calendars would squeeze each to half-width on a phone.
  const [openCustomField, setOpenCustomField] = useState<'from' | 'to' | null>(null);

  const filteredGenres = useMemo(
    () => genreOptions.filter((o) => matches(o, genreQuery.trim().toLowerCase())),
    [genreOptions, genreQuery],
  );
  const filteredCountries = useMemo(
    () => countryOptions.filter((o) => matches(o, countryQuery.trim().toLowerCase())),
    [countryOptions, countryQuery],
  );

  const periodKeys = Object.keys(periodLabels) as Exclude<PeriodKey, 'custom'>[];
  const customFrom = customRange?.from ?? new Date();
  const customTo = customRange?.to ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grip} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('festival.genres')}</Text>
            <SearchBox
              value={genreQuery}
              onChangeText={setGenreQuery}
              placeholder={t('discover.filterSearchGenre')}
            />
            <View style={styles.chipList}>
              {filteredGenres.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  active={genres.includes(option.value)}
                  onPress={() => onChangeGenres(toggleValue(genres, option.value))}
                />
              ))}
              {filteredGenres.length === 0 && (
                <Text style={styles.emptyText}>{t('discover.filterNoMatch')}</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('djmag.filterCountry')}</Text>
            <SearchBox
              value={countryQuery}
              onChangeText={setCountryQuery}
              placeholder={t('discover.filterSearchCountry')}
            />
            <View style={styles.chipList}>
              {filteredCountries.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  active={countries.includes(option.value)}
                  onPress={() => onChangeCountries(toggleValue(countries, option.value))}
                />
              ))}
              {filteredCountries.length === 0 && (
                <Text style={styles.emptyText}>{t('discover.filterNoMatch')}</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('discover.period')}</Text>
            <View style={styles.chipList}>
              {periodKeys.map((key) => (
                <Chip
                  key={key}
                  label={periodLabels[key]}
                  active={period === key}
                  onPress={() => onChangePeriod(key)}
                />
              ))}
              <Chip
                label={t('discover.periodCustom')}
                active={period === 'custom'}
                onPress={() => onChangePeriod('custom')}
              />
            </View>
            {period === 'custom' && (
              <View style={styles.customRange}>
                <Pressable
                  style={styles.customRow}
                  onPress={() => setOpenCustomField((f) => (f === 'from' ? null : 'from'))}
                >
                  <Text style={styles.customLabel}>{t('discover.periodFrom')}</Text>
                  <Text style={styles.customValue}>
                    {customFrom.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </Pressable>
                {openCustomField === 'from' && (
                  <InlineDatePicker
                    value={customFrom}
                    onChange={(d) => {
                      onChangeCustomRange(d, customTo);
                      setOpenCustomField(null);
                    }}
                    locale={locale}
                  />
                )}
                <Pressable
                  style={styles.customRow}
                  onPress={() => setOpenCustomField((f) => (f === 'to' ? null : 'to'))}
                >
                  <Text style={styles.customLabel}>{t('discover.periodTo')}</Text>
                  <Text style={styles.customValue}>
                    {customTo.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </Pressable>
                {openCustomField === 'to' && (
                  <InlineDatePicker
                    value={customTo}
                    onChange={(d) => {
                      onChangeCustomRange(customFrom, d);
                      setOpenCustomField(null);
                    }}
                    locale={locale}
                  />
                )}
              </View>
            )}
          </View>
        </ScrollView>
        <Button label={t('discover.applyFilters')} onPress={onClose} style={styles.applyButton} />
      </View>
    </Modal>
  );
}

function SearchBox({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.searchWrap}>
      <Ionicons name="search" size={14} color={colors.textMuted} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={10}>
          <Ionicons name="close-circle" size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000088' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '85%',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  grip: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  scrollContent: { gap: spacing.xl, paddingVertical: spacing.sm },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { marginTop: 1 },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  customRange: { gap: spacing.sm, marginTop: spacing.sm },
  customRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  customValue: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  applyButton: { marginTop: spacing.sm },
});
