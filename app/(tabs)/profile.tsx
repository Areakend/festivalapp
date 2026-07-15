import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { ScheduleRow } from '@/components/festival/ScheduleRow';
import { signOut } from '@/features/auth/api';
import { useSessionStore } from '@/features/auth/session-store';
import {
  useFestivals,
  useMyAttendances,
  useMyMostSeenArtist,
  useMyStatuses,
  type CatalogItem,
} from '@/features/festivals/api';
import { useMyReviews } from '@/features/reviews/api';
import { useDjMagTop100, useMyProfile, useUpdateProfile } from '@/features/profile/api';
import { useDeleteAccount } from '@/features/moderation/api';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { colors, radii, spacing, typography } from '@/theme';
import { countryFlag } from '@/utils/format';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  nl: 'Nederlands',
  de: 'Deutsch',
  es: 'Español',
};

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useSessionStore((s) => s.session);

  const { data: profile } = useMyProfile();
  const { data: catalog } = useFestivals();
  const { data: myStatuses } = useMyStatuses();
  const { data: myAttendances } = useMyAttendances();
  const { data: myReviews } = useMyReviews();
  const { data: djmag } = useDjMagTop100();
  const { data: mostSeenArtist } = useMyMostSeenArtist();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState('');
  useEffect(() => {
    if (profile) setName(profile.display_name);
  }, [profile]);

  // Apply the stored language preference once the profile loads.
  useEffect(() => {
    if (profile && profile.preferred_language !== i18n.language) {
      void i18n.changeLanguage(profile.preferred_language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.preferred_language]);

  const stats = useMemo(() => {
    const byId = new Map((catalog ?? []).map((item) => [item.festival.id, item.festival]));
    const attended = (myStatuses ?? []).filter((s) => s.status === 'attended');
    const countries = new Set(
      attended.map((s) => byId.get(s.festival_id)?.country).filter(Boolean),
    );
    const ratings = (myReviews ?? []).map((r) => r.overall_rating);
    const avgRating =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
    const attendedIds = new Set(attended.map((s) => s.festival_id));
    const djmagCount = (djmag?.entries ?? []).filter((e) =>
      attendedIds.has(e.festivals.id),
    ).length;
    const topRated = [...(myReviews ?? [])]
      .sort((a, b) => b.overall_rating - a.overall_rating)
      .slice(0, 3)
      .map((r) => ({ rating: r.overall_rating, name: byId.get(r.festival_id)?.name ?? '—' }));

    // Most-attended festival: count edition-years logged per festival.
    const festivalCounts = new Map<string, number>();
    for (const a of myAttendances ?? []) {
      festivalCounts.set(a.festival_id, (festivalCounts.get(a.festival_id) ?? 0) + 1);
    }
    let topFestival: { name: string; count: number } | null = null;
    for (const [festivalId, count] of festivalCounts) {
      if (!topFestival || count > topFestival.count) {
        topFestival = { name: byId.get(festivalId)?.name ?? '—', count };
      }
    }

    // Most-attended country: same, resolved through each attendance's festival.
    const countryCounts = new Map<string, number>();
    for (const a of myAttendances ?? []) {
      const country = byId.get(a.festival_id)?.country;
      if (!country) continue;
      countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
    }
    let topCountry: { country: string; count: number } | null = null;
    for (const [country, count] of countryCounts) {
      if (!topCountry || count > topCountry.count) topCountry = { country, count };
    }

    return {
      attended: attended.length,
      countries: countries.size,
      avgRating,
      djmagCount,
      topRated,
      topFestival,
      topCountry,
    };
  }, [catalog, myStatuses, myAttendances, myReviews, djmag]);

  const changeLanguage = (lang: SupportedLanguage) => {
    void i18n.changeLanguage(lang);
    updateProfile.mutate({ preferred_language: lang });
  };

  // "Mes festivals" filter: status (attended/planned) + year (attended only).
  const [myStatusFilter, setMyStatusFilter] = useState<'all' | 'attended' | 'planned'>('all');
  const [myYearFilter, setMyYearFilter] = useState<number | 'all'>('all');

  const myYears = useMemo(
    () => [...new Set((myAttendances ?? []).map((a) => a.attended_year))].sort((a, b) => b - a),
    [myAttendances],
  );

  const myFestivalItems = useMemo(() => {
    const byId = new Map((catalog ?? []).map((item) => [item.festival.id, item]));
    const attendedYearByFestival = new Map(
      (myAttendances ?? []).map((a) => [a.festival_id, a.attended_year] as const),
    );
    const rows = (myStatuses ?? [])
      .filter((s) => s.status === 'attended' || s.status === 'planned')
      .filter((s) => myStatusFilter === 'all' || s.status === myStatusFilter)
      .map((s) => ({ item: byId.get(s.festival_id), status: s.status }))
      .filter((row): row is { item: CatalogItem; status: 'attended' | 'planned' } => row.item != null)
      .filter((row) => {
        if (row.status !== 'attended' || myYearFilter === 'all') return true;
        return attendedYearByFestival.get(row.item.festival.id) === myYearFilter;
      });

    // A festival can legitimately carry both "attended" and "planned" at
    // once (been before, going again) — in the "All" view that means the
    // same festival matches both filtered rows above, which reads as a
    // glitchy duplicate rather than useful info. Collapse to one row per
    // festival, "attended" winning the displayed status.
    const deduped = new Map<string, { item: CatalogItem; status: 'attended' | 'planned' }>();
    for (const row of rows) {
      const existing = deduped.get(row.item.festival.id);
      if (!existing || row.status === 'attended') deduped.set(row.item.festival.id, row);
    }

    return [...deduped.values()].sort((a, b) => {
      const aDate = a.item.nextEdition?.start_date;
      const bDate = b.item.nextEdition?.start_date;
      if (!aDate) return !bDate ? a.item.festival.name.localeCompare(b.item.festival.name) : 1;
      if (!bDate) return -1;
      return aDate.localeCompare(bDate);
    });
  }, [catalog, myStatuses, myAttendances, myStatusFilter, myYearFilter]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  const deleteAccount = useDeleteAccount();

  // Double confirmation: destructive and irreversible (Play requires the
  // in-app path; the server function wipes auth user + all cascaded data).
  const confirmDeleteAccount = () => {
    Alert.alert(t('profile.deleteAccount'), t('profile.deleteAccountWarning'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('profile.deleteAccount'), t('profile.deleteAccountFinal'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: () =>
                deleteAccount.mutate(undefined, {
                  onError: (error) => Alert.alert(t('common.error'), error.message),
                }),
            },
          ]),
      },
    ]);
  };


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
      ]}
    >
      <Text style={styles.title}>{profile?.display_name ?? '…'}</Text>
      <Text style={styles.email}>{session?.user.email}</Text>

      {/* Stats grid */}
      <View style={styles.grid}>
        <StatBox value={String(stats.attended)} label={t('profile.festivalsAttended')} />
        <StatBox value={String(stats.countries)} label={t('profile.countriesVisited')} />
        <StatBox
          value={stats.avgRating != null ? `${stats.avgRating.toFixed(1)}/20` : '–'}
          label={t('profile.avgRatingGiven')}
        />
        <StatBox value={`${stats.djmagCount}/100`} label={t('djmag.title')} />
      </View>

      {/* Top rated */}
      {stats.topRated.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.topRated')}</Text>
          {stats.topRated.map((entry, index) => (
            <View key={index} style={styles.topRow}>
              <Text style={styles.topName} numberOfLines={1}>
                {entry.name}
              </Text>
              <Text style={styles.topRating}>★ {entry.rating.toFixed(1)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Records: most-attended festival/country, most-seen artist */}
      {(stats.topFestival || stats.topCountry || mostSeenArtist) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.records')}</Text>
          {stats.topFestival && (
            <View style={styles.topRow}>
              <Text style={styles.topName} numberOfLines={1}>
                {t('profile.mostAttendedFestival')} · {stats.topFestival.name}
              </Text>
              <Text style={styles.topRating}>{stats.topFestival.count}</Text>
            </View>
          )}
          {mostSeenArtist && (
            <View style={styles.topRow}>
              <Text style={styles.topName} numberOfLines={1}>
                {t('profile.mostSeenArtist')} · {mostSeenArtist.name}
              </Text>
              <Text style={styles.topRating}>{mostSeenArtist.count}</Text>
            </View>
          )}
          {stats.topCountry && (
            <View style={styles.topRow}>
              <Text style={styles.topName} numberOfLines={1}>
                {t('profile.mostAttendedCountry')} · {countryFlag(stats.topCountry.country)}
              </Text>
              <Text style={styles.topRating}>{stats.topCountry.count}</Text>
            </View>
          )}
        </View>
      )}

      {/* My festivals — filterable by status/year */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.myFestivals')}</Text>
        <View style={styles.filterRow}>
          <Chip
            label={t('common.seeAll')}
            active={myStatusFilter === 'all'}
            onPress={() => setMyStatusFilter('all')}
          />
          <Chip
            label={t('festival.attended')}
            active={myStatusFilter === 'attended'}
            onPress={() => setMyStatusFilter('attended')}
          />
          <Chip
            label={t('festival.planned')}
            active={myStatusFilter === 'planned'}
            onPress={() => setMyStatusFilter('planned')}
          />
        </View>
        {myYears.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <Chip
              label={t('profile.allYears')}
              active={myYearFilter === 'all'}
              onPress={() => setMyYearFilter('all')}
            />
            {myYears.map((y) => (
              <Chip
                key={y}
                label={String(y)}
                active={myYearFilter === y}
                onPress={() => setMyYearFilter(y)}
              />
            ))}
          </ScrollView>
        )}
        <View style={styles.myFestivalsList}>
          {myFestivalItems.map(({ item }) => (
            <ScheduleRow
              key={item.festival.id}
              item={item}
              meta={
                item.nextEdition
                  ? `${formatDate(item.nextEdition.start_date)}${
                      item.nextEdition.end_date ? ` – ${formatDate(item.nextEdition.end_date)}` : ''
                    }`
                  : t('home.dateTbc')
              }
              locale={i18n.language}
              onPress={() =>
                router.push({ pathname: '/festival/[slug]', params: { slug: item.festival.slug } })
              }
            />
          ))}
          {myFestivalItems.length === 0 && (
            <Text style={styles.emptyFilter}>{t('empty.noResults')}</Text>
          )}
        </View>
      </View>

      {/* Edit profile */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.editProfile')}</Text>
        <TextField label={t('profile.displayName')} value={name} onChangeText={setName} />
        {name.trim() !== (profile?.display_name ?? '') && name.trim().length > 0 && (
          <Button
            label={t('common.save')}
            onPress={() => updateProfile.mutate({ display_name: name.trim() })}
            loading={updateProfile.isPending}
          />
        )}
      </View>

      {/* Language */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.language')}</Text>
        <View style={styles.langRow}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Chip
              key={lang}
              label={LANGUAGE_LABELS[lang]}
              active={i18n.language === lang}
              onPress={() => changeLanguage(lang)}
            />
          ))}
        </View>
      </View>

      <Button
        label={t('share.lastTitle')}
        variant="secondary"
        onPress={() => router.push({ pathname: '/share/[kind]', params: { kind: 'last' } })}
      />
      <Button
        label={t('friends.title')}
        variant="secondary"
        onPress={() => router.push('/friends')}
      />
      <Button label={t('auth.signOut')} variant="ghost" onPress={() => void signOut()} />
      <Button
        label={t('profile.deleteAccount')}
        variant="ghost"
        onPress={confirmDeleteAccount}
        loading={deleteAccount.isPending}
        style={styles.deleteAccount}
      />
    </ScrollView>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
  },
  email: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: -spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statValue: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  statLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  topName: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  topRating: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.rating,
  },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  deleteAccount: { opacity: 0.6 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  myFestivalsList: { gap: spacing.sm },
  emptyFilter: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
