import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AppFooter: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
      <Text style={styles.text}>
        Developed by{' '}
        <Text style={styles.name}>Parth Godhani</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: Colors.surfaceDark,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderDark,
    paddingTop: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.caption,
    color: Colors.textSecondaryDark,
    textAlign: 'center',
  },
  name: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
});
