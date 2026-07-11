import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { BorderRadius, Shadow } from '../../theme/spacing';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type IconButtonVariant = 'default' | 'elevated' | 'filled';

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  radius?: number;
  variant?: IconButtonVariant;
  iconColor?: string;
  iconSize?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

// Small square icon-only button used throughout headers and toolbars
export const IconButton: React.FC<IconButtonProps> = ({
  icon, onPress, accessibilityLabel, size = 44, radius = BorderRadius.lg,
  variant = 'default', iconColor, iconSize, disabled, style,
}) => {
  const resolvedIconColor = disabled
    ? Colors.textSecondaryDark
    : (iconColor ?? (variant === 'filled' ? Colors.white : Colors.textPrimaryDark));

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { width: size, height: size, borderRadius: radius },
        variant === 'default' && styles.default,
        variant === 'elevated' && styles.elevated,
        variant === 'filled' && styles.filled,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
    >
      <MaterialCommunityIcons name={icon} size={iconSize ?? Math.round(size * 0.5)} color={resolvedIconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  default: { backgroundColor: Colors.surfaceDark, borderWidth: 1, borderColor: Colors.borderDark },
  elevated: { backgroundColor: Colors.surfaceElevatedDark },
  filled: { backgroundColor: Colors.primary, ...Shadow.sm },
  disabled: { opacity: 0.4 },
});
