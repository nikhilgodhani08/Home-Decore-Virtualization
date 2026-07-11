import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius, Shadow } from '../../theme/spacing';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  iconSize?: number;
  loading?: boolean;
  disabled?: boolean;
  radius?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
  textVariant?: 'h4' | 'bodyMedium';
  shadow?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

// Primary call-to-action button with the brand coral gradient fill
export const GradientButton: React.FC<GradientButtonProps> = ({
  label, onPress, icon, iconSize = 22, loading, disabled,
  radius = BorderRadius.full, paddingVertical = Spacing.lg, paddingHorizontal = Spacing.xl,
  textVariant = 'h4', shadow = true, accessibilityLabel, style,
}) => (
  <TouchableOpacity
    style={[styles.wrapper, { borderRadius: radius }, shadow && Shadow.md, style]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.9}
    accessibilityLabel={accessibilityLabel ?? label}
  >
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={[styles.inner, { paddingVertical, paddingHorizontal }]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
    >
      {loading
        ? <ActivityIndicator size="small" color={Colors.white} />
        : icon && <MaterialCommunityIcons name={icon} size={iconSize} color={Colors.white} />}
      <Text style={textVariant === 'h4' ? styles.textH4 : styles.textBodyMedium}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrapper: { overflow: 'hidden' },
  inner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
  },
  textH4: { ...Typography.h4, color: Colors.white },
  textBodyMedium: { ...Typography.bodyMedium, color: Colors.white },
});
