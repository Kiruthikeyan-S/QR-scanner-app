import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SavedQRsScreen } from '../screens/SavedQRsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AppIcon, IconName } from '../components/AppIcon';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius } from '../theme/typography';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();

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
          height: Platform.OS === 'ios' ? 88 : 64,
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
});
