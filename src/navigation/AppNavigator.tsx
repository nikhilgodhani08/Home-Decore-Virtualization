import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

import HomeScreen from '../screens/HomeScreen/HomeScreen';
import EditorScreen from '../screens/EditorScreen/EditorScreen';
import PreviewScreen from '../screens/PreviewScreen/PreviewScreen';
import ProjectsScreen from '../screens/ProjectsScreen/ProjectsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0F0F1A' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Editor"
        component={EditorScreen}
        options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
      />
      <Stack.Screen
        name="Preview"
        component={PreviewScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="Projects" component={ProjectsScreen} />
    </Stack.Navigator>
  );
};
