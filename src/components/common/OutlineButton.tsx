import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type OutlineButtonVariant = 'coral' | 'neutral';

interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: OutlineButtonVariant;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

// Secondary bordered button — coral outline for accent actions, neutral fill for utility actions
export const OutlineButton: React.FC<OutlineButtonProps> = ({
  label, onPress, icon, variant = 'coral', accessibilityLabel, style,
}) => {
  const isCoral = variant === 'coral';
  const contentColor = isCoral ? Colors.primary : Colors.textPrimaryDark;

  return (
    <TouchableOpacity
      style={[styles.base, isCoral ? styles.coral : styles.neutral, style]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {icon && <MaterialCommunityIcons name={icon} size={20} color={contentColor} />}
      <Text style={[styles.text, { color: contentColor }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  coral: { backgroundColor: Colors.transparent, borderColor: Colors.primary },
  neutral: { backgroundColor: Colors.surfaceElevatedDark, borderColor: Colors.borderDark },
  text: { ...Typography.bodyMedium },
});
