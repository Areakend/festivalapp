import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/theme';

/**
 * Deep-link target for the Spotify OAuth redirect (festiq://spotify/callback).
 * expo-auth-session's AuthRequest.promptAsync intercepts this before Expo
 * Router would otherwise try (and fail) to match it as a real screen.
 */
export default function SpotifyCallbackScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
