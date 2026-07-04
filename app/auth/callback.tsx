import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/theme';

/**
 * Deep-link target for OAuth redirects (festiq://auth/callback). The actual
 * code exchange happens in signInWithGoogle via WebBrowser.openAuthSessionAsync;
 * this screen only exists so Expo Router has somewhere to land instead of
 * showing "Unmatched Route" while that promise resolves and the session
 * listener flips the app over to the signed-in stack.
 */
export default function AuthCallbackScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
