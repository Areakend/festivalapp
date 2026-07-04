/**
 * Mainstage design tokens — dark-first, festival/nightlife aesthetic.
 * All UI components should consume these tokens instead of hardcoding values.
 */

export const colors = {
  // backgrounds
  background: '#0B0B14',
  surface: '#161624',
  surfaceElevated: '#1F1F32',
  border: '#2C2C44',

  // brand
  primary: '#8B5CF6',
  primaryPressed: '#7C4DEF',
  accent: '#EC4899',
  gradientStart: '#8B5CF6',
  gradientEnd: '#EC4899',

  // text
  text: '#F4F4F6',
  textSecondary: '#A5A5B8',
  textMuted: '#6E6E85',
  textOnPrimary: '#FFFFFF',

  // semantic
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  rating: '#FBBF24',
  spotify: '#1DB954',

  // status colors for festival tracking
  statusAttended: '#34D399',
  statusPlanned: '#60A5FA',
  statusWishlist: '#F472B6',
  statusFavorite: '#FBBF24',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const typography = {
  // Space Grotesk for display/headings, Inter for body — loaded in app/_layout.tsx
  fonts: {
    heading: 'SpaceGrotesk_700Bold',
    headingMedium: 'SpaceGrotesk_500Medium',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemiBold: 'Inter_600SemiBold',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
  },
} as const;

export const theme = { colors, spacing, radii, typography };
export type Theme = typeof theme;
