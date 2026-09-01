const { withAndroidStyles, withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/**
 * Addresses two Play Console "recommended actions" flagged on the production
 * release:
 *
 * 1. "Obsolete edge-to-edge APIs/settings" — RN's base Android template still
 *    emits `android:statusBarColor` on AppTheme even with
 *    android.edgeToEdgeEnabled set in app.json, which is exactly the
 *    deprecated-on-Android-15 attribute Play flags (the OS ignores/ deprecates
 *    a manually-set status bar background once edge-to-edge is enforced).
 *    Stripping it (and enforceNavigationBarContrast, same category) lets
 *    Android's edge-to-edge defaults take over cleanly.
 *
 * 2. "Restricts resizing/orientation for large screens" — the app is
 *    portrait-locked (by design, no tablet UI built/tested yet) AND had no
 *    explicit resizeableActivity declaration, which Play treats as the
 *    non-compliant combination. Declaring resizeableActivity="true" lets
 *    Android letterbox/window the portrait UI on large screens instead of
 *    blocking or force-stretching it, without requiring an actual landscape
 *    or tablet redesign.
 */
module.exports = function withLargeScreenCompat(config) {
  config = withAndroidStyles(config, (config) => {
    const appTheme = config.modResults.resources.style?.find((s) => s.$.name === 'AppTheme');
    if (appTheme && Array.isArray(appTheme.item)) {
      appTheme.item = appTheme.item.filter(
        (item) => item.$.name !== 'android:statusBarColor' && item.$.name !== 'android:enforceNavigationBarContrast',
      );
    }
    return config;
  });

  config = withAndroidManifest(config, (config) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    mainActivity.$['android:resizeableActivity'] = 'true';
    return config;
  });

  return config;
};
