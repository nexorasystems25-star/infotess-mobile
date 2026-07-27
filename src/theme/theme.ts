// Color tokens — dark fintech theme
const darkColors = {
  // Surfaces
  bg: '#0B0F14',
  surface: '#121821',
  surface2: '#1A2230',
  surface3: '#232D3D',
  hairline: '#2A3545',
  // Text
  text: '#F2F5FA',
  textDim: '#9BA7B8',
  textMuted: '#5A6675',
  // Brand
  primary: '#00E5A0',
  primarySoft: '#0E3A2C',
  secondary: '#4F9EFF',
  accent: '#FFB347',
  danger: '#FF5C7A',
  success: '#00E5A0',
  warning: '#FFD166',
  // Charts
  chart: ['#00E5A0', '#4F9EFF', '#FFB347', '#FF5C7A', '#9B8CFF'],
} as const;

// Light theme color tokens
const lightColors = {
  // Surfaces
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  surface2: '#F0F2F5',
  surface3: '#E4E8ED',
  hairline: '#D1D8E0',
  // Text
  text: '#1A2230',
  textDim: '#5A6675',
  textMuted: '#9BA7B8',
  // Brand
  primary: '#00B87A',
  primarySoft: '#E6F9F1',
  secondary: '#3380E8',
  accent: '#E89830',
  danger: '#E8445C',
  success: '#00B87A',
  warning: '#E8B830',
  // Charts
  chart: ['#00B87A', '#3380E8', '#E89830', '#E8445C', '#7B6EE0'],
} as const;

// Typography
const typography = {
  display: { fontFamily: 'System', fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 40 },
  h1: { fontFamily: 'System', fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 32 },
  h2: { fontFamily: 'System', fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  h3: { fontFamily: 'System', fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontFamily: 'System', fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontFamily: 'System', fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  small: { fontFamily: 'System', fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontFamily: 'System', fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.4, lineHeight: 14 },
  mono: { fontFamily: 'Menlo', fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
} as const;

// Spacing — 4pt grid
const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40 } as const;

// Radii
const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

// Shadows — RN-style
const darkShadows = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 6 },
  soft: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 2 },
};

const lightShadows = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  soft: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
};

type ColorTokens = {
  bg: string; surface: string; surface2: string; surface3: string; hairline: string;
  text: string; textDim: string; textMuted: string;
  primary: string; primarySoft: string; secondary: string; accent: string;
  danger: string; success: string; warning: string;
  chart: readonly string[];
};

type ShadowTokens = { card: any; soft: any };

export type Theme = {
  colors: ColorTokens;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: ShadowTokens;
  isDark: boolean;
};

export const darkTheme: Theme = { colors: darkColors, typography, spacing, radii, shadows: darkShadows, isDark: true };
export const lightTheme: Theme = { colors: lightColors, typography, spacing, radii, shadows: lightShadows, isDark: false };

// Static default (dark) for backward compatibility with existing imports
export const theme = darkTheme;
