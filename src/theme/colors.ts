export const Colors = {
  // Brand — warm coral primary + teal secondary (modern, friendly)
  primary: '#FF7A59',        // warm coral
  primaryDark: '#F2603C',    // deep coral
  primaryLight: '#FF9E85',   // soft coral
  secondary: '#2DD4BF',      // fresh teal
  secondaryDark: '#14B8A6',
  accent: '#2DD4BF',

  // Semantic
  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',

  // Light mode
  bgLight: '#F7F7F5',
  surfaceLight: '#FFFFFF',
  surfaceElevatedLight: '#EFEEEA',
  borderLight: '#E4E2DC',
  textPrimary: '#1B1B1F',
  textSecondary: '#6B6B72',
  textDisabled: '#A0A0A6',

  // Dark mode — refined neutral near-black
  bgDark: '#121214',
  surfaceDark: '#1C1C20',
  surfaceElevatedDark: '#28282E',
  borderDark: '#33333A',
  textPrimaryDark: '#FAFAFA',
  textSecondaryDark: '#9A9AA2',

  // Canvas
  canvasBg: '#1C1C20',
  selectionBorder: '#FF7A59',
  selectionHandle: '#FFFFFF',
  gridLine: 'rgba(255,255,255,0.05)',

  // Categories
  categoryFurniture: '#FF7A59',
  categoryDecor: '#F472B6',
  categoryLighting: '#FBBF24',
  categoryAccessories: '#2DD4BF',

  // Transparent helpers
  overlay: 'rgba(0,0,0,0.62)',
  overlayLight: 'rgba(0,0,0,0.35)',
  primaryGlow: 'rgba(255,122,89,0.28)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Background gradient stops (dark screens)
  gradientStart: '#121214',
  gradientMid: '#17161B',
  gradientEnd: '#1B1620',
};

export type ColorKey = keyof typeof Colors;
