import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Animated, StatusBar, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius, Shadow } from '../../theme/spacing';

const CORRECT_PASSWORD = 'parth@9282';
const APP_NAME = 'Bapasitaram home decore & gift';

interface LoginScreenProps {
  onLoginSuccess: (remember: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Please enter your password');
      shake();
      return;
    }
    setLoading(true);
    // small artificial delay for UX
    await new Promise(r => setTimeout(r, 400));
    if (password === CORRECT_PASSWORD) {
      setError('');
      setLoading(false);
      onLoginSuccess(rememberMe);
    } else {
      setError('Invalid Password');
      shake();
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      <LinearGradient
        colors={['#0F0F1A', '#1A1A2E', '#16213E']}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        style={styles.kbAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Logo */}
          <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.logoBg}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="sofa" size={40} color={Colors.white} />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>Welcome back! Please sign in.</Text>

          {/* Password Field */}
          <Animated.View style={[styles.inputGroup, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={Colors.textSecondaryDark}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                placeholder="Enter password"
                placeholderTextColor={Colors.textSecondaryDark}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(s => !s)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textSecondaryDark}
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Remember Me */}
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(s => !s)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe && (
                <MaterialCommunityIcons name="check" size={14} color={Colors.white} />
              )}
            </View>
            <Text style={styles.rememberText}>Remember Me</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.loginBtnInner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <Text style={styles.loginBtnText}>Signing in…</Text>
              ) : (
                <>
                  <MaterialCommunityIcons name="login" size={20} color={Colors.white} />
                  <Text style={styles.loginBtnText}>Sign In</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footerNote}>
            Secure access · Your designs are private
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Bottom branding */}
      <View style={styles.bottomBrand}>
        <Text style={styles.devBy}>
          Developed by{' '}
          <Text style={styles.devName}>Parth Godhani</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  kbAvoid: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },

  card: {
    width: '100%',
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.xl * 1.5,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
    ...Shadow.lg,
  },

  logoWrap: { marginBottom: Spacing.lg },
  logoBg: {
    width: 80, height: 80,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },

  appName: {
    ...Typography.h3,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondaryDark,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  inputGroup: { width: '100%', marginBottom: Spacing.md },
  label: {
    ...Typography.caption,
    color: Colors.textSecondaryDark,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevatedDark,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.white,
    paddingVertical: Spacing.md,
  },
  eyeBtn: { padding: 4 },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  errorText: { ...Typography.caption, color: Colors.error },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  checkbox: {
    width: 20, height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.borderDark,
    backgroundColor: Colors.surfaceElevatedDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rememberText: { ...Typography.body, color: Colors.textSecondaryDark },

  loginBtn: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.md,
    marginBottom: Spacing.lg,
  },
  loginBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  loginBtnText: { ...Typography.h4, color: Colors.white },

  footerNote: {
    ...Typography.caption,
    color: Colors.textSecondaryDark,
    textAlign: 'center',
    opacity: 0.6,
  },

  bottomBrand: {
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  devBy: { ...Typography.caption, color: Colors.textSecondaryDark },
  devName: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
});
