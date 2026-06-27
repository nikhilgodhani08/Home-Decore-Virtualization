export const Colors = {
  // Brand
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#93C5FD',
  secondary: '#8B5CF6',
  secondaryDark: '#7C3AED',
  accent: '#06B6D4',

  // Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Light mode
  bgLight: '#F9FAFB',
  surfaceLight: '#FFFFFF',
  surfaceElevatedLight: '#F3F4F6',
  borderLight: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',

  // Dark mode
  bgDark: '#0F0F1A',
  surfaceDark: '#1C1C2E',
  surfaceElevatedDark: '#252538',
  borderDark: '#374151',
  textPrimaryDark: '#F9FAFB',
  textSecondaryDark: '#9CA3AF',

  // Canvas
  canvasBg: '#1A1A2E',
  selectionBorder: '#3B82F6',
  selectionHandle: '#FFFFFF',
  gridLine: 'rgba(255,255,255,0.05)',

  // Categories
  categoryFurniture: '#F59E0B',
  categoryDecor: '#EC4899',
  categoryLighting: '#8B5CF6',
  categoryAccessories: '#10B981',

  // Transparent helpers
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export type ColorKey = keyof typeof Colors;
