import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { Colors } from './colors';

const baseTheme = {
  roundness: 12,
  colors: {
    primary: Colors.primary,
    secondary: Colors.secondary,
    tertiary: Colors.accent,
    error: Colors.error,
  },
};

export const LightTheme = {
  ...MD3LightTheme,
  ...baseTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...baseTheme.colors,
    background: Colors.bgLight,
    surface: Colors.surfaceLight,
    surfaceVariant: Colors.surfaceElevatedLight,
    onSurface: Colors.textPrimary,
    onBackground: Colors.textPrimary,
    outline: Colors.borderLight,
  },
};

export const DarkTheme = {
  ...MD3DarkTheme,
  ...baseTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...baseTheme.colors,
    background: Colors.bgDark,
    surface: Colors.surfaceDark,
    surfaceVariant: Colors.surfaceElevatedDark,
    onSurface: Colors.textPrimaryDark,
    onBackground: Colors.textPrimaryDark,
    outline: Colors.borderDark,
  },
};

export type AppTheme = typeof LightTheme;
