import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radii, spacing, typography } from '@/theme';

interface TermsGateProps {
  agreed: boolean;
  onToggle: () => void;
}

/**
 * Checkbox + full terms text, shown above the submit buttons on both the
 * sign-up and sign-in screens (a first-time Google user can create their
 * account from either one). Apple's UGC guideline (1.2) requires the terms
 * — with an explicit no-tolerance clause for objectionable content and
 * abusive users — to be presented before registering or logging in, not
 * just linked out to an external page.
 */
export function TermsGate({ agreed, onToggle }: TermsGateProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.row} onPress={onToggle} hitSlop={8}>
        <Ionicons
          name={agreed ? 'checkbox' : 'square-outline'}
          size={20}
          color={agreed ? colors.primary : colors.textMuted}
        />
        <Text style={styles.label}>
          {t('auth.termsAgreePrefix')}{' '}
          <Text style={styles.link} onPress={() => setOpen(true)}>
            {t('auth.termsLink')}
          </Text>
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.termsLink')}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={styles.paragraph}>{t('auth.termsIntro')}</Text>
            <Text style={styles.heading}>{t('auth.termsUgcHeading')}</Text>
            <Text style={styles.paragraph}>{t('auth.termsUgcBody')}</Text>
            <Text style={styles.heading}>{t('auth.termsReportHeading')}</Text>
            <Text style={styles.paragraph}>{t('auth.termsReportBody')}</Text>
            <Text style={styles.heading}>{t('auth.termsAccountHeading')}</Text>
            <Text style={styles.paragraph}>{t('auth.termsAccountBody')}</Text>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  link: { color: colors.primary, fontFamily: typography.fonts.bodyMedium },
  backdrop: { flex: 1, backgroundColor: '#00000088' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '80%',
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
  body: { paddingHorizontal: spacing.xl },
  bodyContent: { paddingBottom: spacing.lg, gap: spacing.sm },
  heading: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginTop: spacing.md,
  },
  paragraph: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
