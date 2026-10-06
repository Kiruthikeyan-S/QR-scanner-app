import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { typography, borderRadius, spacing } from '../theme/typography';
import { triggerLightHaptic } from '../utils/feedback';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'outline' | 'ghost' | 'tinted';
  color?: 'primary' | 'secondary' | 'accent' | 'danger' | 'neutral';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  icon,
  variant = 'outline',
  color = 'neutral',
  disabled = false,
  style,
  textStyle,
  size = 'md',
}) => {
  const { theme, isDark } = useTheme();

  const getColor = () => {
    switch (color) {
      case 'primary':
        return theme.primary;
      case 'secondary':
        return theme.secondary;
      case 'accent':
        return theme.accent;
      case 'danger':
        return theme.danger;
      case 'neutral':
      default:
        return theme.text;
    }
  };

  const activeColor = getColor();

  const getBackground = (pressed: boolean) => {
    if (variant === 'tinted') {
      if (color === 'primary') return theme.primaryLight;
      if (color === 'secondary') return theme.secondaryLight;
      if (color === 'accent') return theme.accentLight;
      return theme.surfaceVariant;
    }
    if (variant === 'outline') {
      return pressed ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent';
    }
    return pressed ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent';
  };

  const handlePress = () => {
    if (disabled) return;
    triggerLightHaptic();
    onPress();
  };

  const height = size === 'sm' ? 36 : size === 'md' ? 44 : 50;
  const fontSize = size === 'sm' ? typography.fontSize.sm : typography.fontSize.base;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          height,
          backgroundColor: getBackground(pressed),
          borderColor: variant === 'outline' ? theme.border : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {icon && (
          <Ionicons
            name={icon}
            size={size === 'sm' ? 16 : 18}
            color={activeColor}
            style={styles.icon}
          />
        )}
        <Text
          style={[
            styles.text,
            {
              fontSize,
              color: activeColor,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
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
  },
});
