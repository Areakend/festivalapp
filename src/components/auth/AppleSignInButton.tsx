import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { radii } from '@/theme';

interface AppleSignInButtonProps {
  disabled?: boolean;
  onPress: () => void;
}

/**
 * Apple's own pre-styled button, not a custom one — Apple's Human Interface
 * Guidelines require using this exact component for Sign in with Apple, and
 * a look-alike built from Button/Pressable risks App Review rejection on
 * design grounds separate from the 4.8 login-service issue this exists to
 * fix. iOS only: there's no Sign in with Apple on Android.
 */
export function AppleSignInButton({ disabled, onPress }: AppleSignInButtonProps) {
  if (Platform.OS !== 'ios') return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={radii.md}
      style={{ height: 48, width: '100%', opacity: disabled ? 0.5 : 1 }}
      onPress={disabled ? () => {} : onPress}
    />
  );
}
