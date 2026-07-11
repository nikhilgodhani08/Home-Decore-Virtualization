import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { AppNavigator } from './src/navigation/AppNavigator';
import { DarkTheme, LightTheme } from './src/theme/theme';
import { Colors } from './src/theme/colors';
import { SplashScreen } from './src/screens/SplashScreen/SplashScreen';

type AppState = 'splash' | 'app';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;

  const [appState, setAppState] = useState<AppState>('splash');

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const handleSplashFinish = () => {
    setAppState('app');
  };

  // Hold a plain dark frame until fonts are ready so the splash renders with
  // the luxury typefaces instead of flashing system fonts.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.bgDark }} />;
  }

  if (appState === 'splash') {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={handleSplashFinish} />
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
