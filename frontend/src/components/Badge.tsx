import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography, borderRadius } from '../theme/typography';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'warning' | 'neutral' | 'success';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
}) => {
  const { theme, isDark } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.primaryLight,
          text: theme.primary,
          border: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(5, 150, 105, 0.2)',
        };
      case 'secondary':
        return {
          bg: theme.secondaryLight,
          text: theme.secondary,
          border: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(79, 70, 229, 0.2)',
        };
      case 'accent':
        return {
          bg: theme.accentLight,
          text: theme.accent,
          border: isDark ? 'rgba(6, 182, 212, 0.3)' : 'rgba(8, 145, 178, 0.2)',
        };
      case 'warning':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
          text: theme.warning,
          border: 'rgba(245, 158, 11, 0.2)',
        };
      case 'success':
        return {
          bg: theme.primaryLight,
          text: theme.success,
          border: 'rgba(16, 185, 129, 0.2)',
        };
      case 'neutral':
      default:
        return {
          bg: theme.surfaceVariant,
          text: theme.textSecondary,
          border: theme.border,
        };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 11,
  },
});
