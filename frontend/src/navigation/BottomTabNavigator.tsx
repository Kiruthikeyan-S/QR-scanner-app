import React from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { SavedQRsScreen } from '../screens/SavedQRsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AppIcon, IconName } from '../components/AppIcon';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius } from '../theme/typography';
import { triggerLightHaptic } from '../utils/feedback';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.navBackground,
          borderTopColor: theme.navBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.semibold,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: IconName = 'home-outline';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'HistoryTab') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'SavedTab') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return (
            <View
              style={[
                styles.iconContainer,
                focused && {
                  backgroundColor: isDark
                    ? 'rgba(16, 185, 129, 0.15)'
                    : palette.emerald[50],
                },
              ]}
            >
              <AppIcon name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{ tabBarLabel: 'History' }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScannerScreen}
        options={{
          tabBarLabel: 'SCAN',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            color: theme.primary,
            marginTop: 4,
          },
          tabBarButton: (props) => (
            <Pressable
              {...(props as any)}
              onPress={() => {
                triggerLightHaptic();
                rootNav.navigate('Scanner');
              }}
              style={styles.centerScanButtonWrapper}
            >
              <View style={[styles.centerScanButton, { backgroundColor: theme.primary }]}>
                <AppIcon name="qr-code" size={26} color="#FFFFFF" />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tab.Screen
        name="SavedTab"
        component={SavedQRsScreen}
        options={{ tabBarLabel: 'Saved' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerScanButtonWrapper: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  centerScanButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
