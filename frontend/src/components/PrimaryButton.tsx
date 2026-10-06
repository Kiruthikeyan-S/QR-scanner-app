import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { typography, borderRadius, spacing } from '../theme/typography';
import { triggerLightHaptic } from '../utils/feedback';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'emerald' | 'indigo' | 'cyan' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  icon,
  variant = 'emerald',
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'lg',
}) => {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.border;
    switch (variant) {
      case 'emerald':
        return theme.primary;
      case 'indigo':
        return theme.secondary;
      case 'cyan':
        return theme.accent;
      case 'danger':
        return theme.danger;
      default:
        return theme.primary;
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;
    triggerLightHaptic();
    onPress();
  };

  const height = size === 'sm' ? 38 : size === 'md' ? 46 : 54;
  const fontSize = size === 'sm' ? typography.fontSize.sm : typography.fontSize.base;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          height,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 16 : 20}
              color="#FFFFFF"
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.text,
              {
                fontSize,
                color: disabled ? theme.textMuted : '#FFFFFF',
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.2,
  },
});
