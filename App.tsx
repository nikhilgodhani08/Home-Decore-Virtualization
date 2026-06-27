import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppNavigator } from './src/navigation/AppNavigator';
import { DarkTheme, LightTheme } from './src/theme/theme';
import { SplashScreen } from './src/screens/SplashScreen/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen/LoginScreen';

type AppState = 'splash' | 'login' | 'app';

const AUTH_KEY = 'auth';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;

  const [appState, setAppState] = useState<AppState>('splash');

  // After splash finishes → check auth
  const handleSplashFinish = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_KEY);
      if (stored === 'true') {
        setAppState('app');
      } else {
        setAppState('login');
      }
    } catch {
      setAppState('login');
    }
  };

  // Login success handler
  const handleLoginSuccess = async (remember: boolean) => {
    if (remember) {
      await AsyncStorage.setItem(AUTH_KEY, 'true');
    }
    // even without "remember me", move to app (session only)
    setAppState('app');
  };

  if (appState === 'splash') {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={handleSplashFinish} />
      </SafeAreaProvider>
    );
  }

  if (appState === 'login') {
    return (
      <SafeAreaProvider>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
