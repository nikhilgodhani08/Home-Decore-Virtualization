import React from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet, StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightActions?: React.ReactNode;
  subtitle?: string;
  transparent?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onBack,
  rightActions,
  subtitle,
  transparent = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      transparent ? styles.transparent : styles.solid,
      { paddingTop: insets.top + Spacing.sm },
    ]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />

      <View style={styles.row}>
        {/* Left: Back button */}
        <View style={styles.left}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Go back"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={Colors.white}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Center: Title */}
        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>

        {/* Right: Actions */}
        <View style={styles.right}>
          {rightActions}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  solid: {
    backgroundColor: Colors.surfaceDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 44,
    justifyContent: 'flex-end',
  },
  iconBtn: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.h4,
    color: Colors.white,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondaryDark,
    marginTop: 1,
  },
});
