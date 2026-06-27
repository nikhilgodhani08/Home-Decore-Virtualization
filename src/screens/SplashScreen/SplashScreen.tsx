import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Shadow } from '../../theme/spacing';

const APP_NAME = 'Bapasitaram home decore & gift';
const CREATOR = 'Created by Parth Godhani';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameSlide = useRef(new Animated.Value(20)).current;
  const creatorOpacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.sequence([
      // Logo pop in
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      // App name slides up
      Animated.parallel([
        Animated.timing(nameOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(nameSlide, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      // Creator fades in
      Animated.timing(creatorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      // Hold for a moment
      Animated.delay(900),
    ]).start(onFinish);
  }, []);

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />

      <LinearGradient
        colors={['#0F0F1A', '#1A1A2E', '#0D1B3E']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      />

      {/* Decorative blobs */}
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      {/* Logo */}
      <Animated.View style={[
        styles.logoWrap,
        { opacity: logoOpacity, transform: [{ scale: logoScale }] },
      ]}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.logoBg}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="sofa" size={60} color={Colors.white} />
        </LinearGradient>
        {/* Glow ring */}
        <Animated.View style={[styles.glowRing, { opacity: shimmerOpacity }]} />
      </Animated.View>

      {/* App Name */}
      <Animated.View style={[
        styles.nameBlock,
        { opacity: nameOpacity, transform: [{ translateY: nameSlide }] },
      ]}>
        <Text style={styles.appName}>{APP_NAME}</Text>
        <View style={styles.divider} />
      </Animated.View>

      {/* Creator */}
      <Animated.View style={[styles.creatorBlock, { opacity: creatorOpacity }]}>
        <Text style={styles.creatorText}>{CREATOR}</Text>
      </Animated.View>

      {/* Bottom dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map(i => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              i === 1 && styles.dotActive,
              { opacity: shimmerOpacity },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },

  blobTL: {
    position: 'absolute', top: -80, left: -80,
    width: 240, height: 240,
    borderRadius: 120,
    backgroundColor: Colors.primary,
    opacity: 0.08,
  },
  blobBR: {
    position: 'absolute', bottom: -100, right: -80,
    width: 280, height: 280,
    borderRadius: 140,
    backgroundColor: Colors.secondary,
    opacity: 0.08,
  },

  logoWrap: { marginBottom: 40, alignItems: 'center', justifyContent: 'center' },
  logoBg: {
    width: 120, height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  glowRing: {
    position: 'absolute',
    width: 150, height: 150,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.primary,
    opacity: 0.4,
  },

  nameBlock: { alignItems: 'center', marginBottom: 24 },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 32,
  },
  divider: {
    marginTop: 12,
    width: 60, height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },

  creatorBlock: { alignItems: 'center', marginBottom: 60 },
  creatorText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    letterSpacing: 0.5,
  },

  dotsRow: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderDark,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
});
