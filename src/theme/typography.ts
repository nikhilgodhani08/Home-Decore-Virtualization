// Clean, modern type scale built on Inter for a friendly consumer-app feel.
// Fonts are loaded in App.tsx via @expo-google-fonts; family names must match
// the keys passed to useFonts.

export const Fonts = {
  bold: 'Inter_700Bold',
  semiBold: 'Inter_600SemiBold',
  medium: 'Inter_500Medium',
  regular: 'Inter_400Regular',
};

export const Typography = {
  h1: {
    fontSize: 30,
    lineHeight: 38,
    fontFamily: Fonts.bold,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: Fonts.bold,
    letterSpacing: -0.4,
  },
  h3: {
    fontSize: 19,
    lineHeight: 26,
    fontFamily: Fonts.semiBold,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.semiBold,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Fonts.regular,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Fonts.medium,
  },
  label: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.medium,
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.regular,
    letterSpacing: 0.2,
  },
};
