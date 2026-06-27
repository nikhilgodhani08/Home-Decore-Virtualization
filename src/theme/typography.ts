import { Platform } from 'react-native';

const fontFamily = Platform.OS === 'android' ? 'Roboto' : 'System';

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    fontFamily,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 30,
    fontFamily,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
    fontFamily,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    fontFamily,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 22,
    fontFamily,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 22,
    fontFamily,
  },
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 18,
    fontFamily,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 16,
    fontFamily,
  },
};
