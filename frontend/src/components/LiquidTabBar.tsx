import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon, IconName } from './AppIcon';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius } from '../theme/typography';
import { triggerLightHaptic } from '../utils/feedback';

export const LiquidTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const tabWidth = windowWidth / 5;
  const slideAnim = useRef(new Animated.Value(state.index * tabWidth)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * tabWidth,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.navBackground,
          borderTopColor: theme.navBorder,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8),
        },
      ]}
    >
      {/* Sliding Active Pill / Indicator */}
      {state.index !== 2 && (
        <Animated.View
          style={[
            styles.activeSlider,
            {
              width: tabWidth - 20,
              transform: [{ translateX: slideAnim }],
              left: 10,
              backgroundColor: isDark
                ? 'rgba(16, 185, 129, 0.16)'
                : palette.emerald[50],
            },
          ]}
        />
      )}

      {/* Tab Buttons */}
      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const isCenterScan = route.name === 'ScanTab';

          let iconName: IconName = 'home-outline';
          let label = 'Home';

          if (route.name === 'HomeTab') {
            iconName = isFocused ? 'home' : 'home-outline';
            label = 'Home';
          } else if (route.name === 'HistoryTab') {
            iconName = isFocused ? 'time' : 'time-outline';
            label = 'History';
          } else if (route.name === 'ScanTab') {
            iconName = 'qr-code';
            label = 'SCAN';
          } else if (route.name === 'SavedTab') {
            iconName = isFocused ? 'bookmark' : 'bookmark-outline';
            label = 'Saved';
          } else if (route.name === 'SettingsTab') {
            iconName = isFocused ? 'settings' : 'settings-outline';
            label = 'Settings';
          }

          const onPress = () => {
            triggerLightHaptic();
            if (isCenterScan) {
              (navigation as any).navigate('Scanner');
              return;
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCenterScan) {
            return (
              <View key={route.key} style={[styles.tabItem, { width: tabWidth }]}>
                <Pressable
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.centerButtonOuter,
                    {
                      transform: [{ scale: pressed ? 0.94 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.centerButton,
                      {
                        backgroundColor: theme.primary,
                        borderColor: isDark ? '#1F2937' : '#FFFFFF',
                      },
                    ]}
                  >
                    <AppIcon name="qr-code" size={24} color="#FFFFFF" />
                  </View>
                  <Text
                    style={[
                      styles.centerLabel,
                      {
                        color: isFocused ? theme.primary : theme.textMuted,
                      },
                    ]}
                  >
                    SCAN
                  </Text>
                </Pressable>
              </View>
            );
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tabItem, { width: tabWidth }]}
            >
              <View style={styles.iconWrapper}>
                <AppIcon
                  name={iconName}
                  size={21}
                  color={isFocused ? theme.primary : theme.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? theme.primary : theme.textMuted,
                    fontWeight: isFocused
                      ? typography.fontWeight.bold
                      : typography.fontWeight.medium,
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    position: 'relative',
  },
  activeSlider: {
    position: 'absolute',
    top: 6,
    height: 44,
    borderRadius: borderRadius.lg,
    zIndex: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
    zIndex: 1,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs - 1,
    textAlign: 'center',
  },
  centerButtonOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -12,
  },
  centerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    borderWidth: 3,
  },
  centerLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.4,
  },
});
