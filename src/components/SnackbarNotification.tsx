import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, BorderRadius } from '../theme/spacing';
import { useUIStore } from '../store/uiStore';

const TYPE_CONFIG = {
  success: { bg: Colors.success, icon: 'check-circle' as const },
  error: { bg: Colors.error, icon: 'alert-circle' as const },
  info: { bg: Colors.primary, icon: 'information' as const },
} as const;

export const SnackbarNotification: React.FC = () => {
  const { snackbarMessage, snackbarType, hideSnackbar } = useUIStore();
  const config = TYPE_CONFIG[snackbarType as keyof typeof TYPE_CONFIG];
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (snackbarMessage) {
      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        dismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbarMessage]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
    ]).start(() => hideSnackbar());
  };

  if (!snackbarMessage) return null;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.snackbar, { backgroundColor: config.bg }]}>
        <MaterialCommunityIcons name={config.icon} size={20} color={Colors.white} />
        <Text style={styles.message} numberOfLines={2}>{snackbarMessage}</Text>
        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="close" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    ...Typography.bodyMedium,
    color: Colors.white,
    flex: 1,
  },
});
