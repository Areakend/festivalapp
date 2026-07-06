import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default true — most forms/screens scroll). */
  scroll?: boolean;
}

/** Base screen wrapper: safe area, background, keyboard handling. */
export function Screen({ children, scroll = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: insets.bottom + spacing.lg,
    paddingHorizontal: spacing.xl,
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.grow, padding]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.grow, padding]}>{children}</View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  grow: { flexGrow: 1 },
});
