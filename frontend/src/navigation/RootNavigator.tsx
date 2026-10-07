import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { BottomTabNavigator } from './BottomTabNavigator';
import { ScannerScreen } from '../screens/ScannerScreen';
import { ScanResultScreen } from '../screens/ScanResultScreen';
import { GeneratorSelectScreen } from '../screens/GeneratorSelectScreen';
import { GeneratorFormScreen } from '../screens/GeneratorFormScreen';
import { QRPreviewScreen } from '../screens/QRPreviewScreen';
import { NetworkCheckerScreen } from '../screens/NetworkCheckerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          animation: 'fade',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen name="ScanResult" component={ScanResultScreen} />
      <Stack.Screen name="GeneratorSelect" component={GeneratorSelectScreen} />
      <Stack.Screen name="GeneratorForm" component={GeneratorFormScreen} />
      <Stack.Screen name="QRPreview" component={QRPreviewScreen} />
      <Stack.Screen name="NetworkChecker" component={NetworkCheckerScreen} />
    </Stack.Navigator>
  );
};
