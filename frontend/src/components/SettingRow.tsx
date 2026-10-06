import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../theme/typography';
import { triggerLightHaptic } from '../utils/feedback';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  type?: 'toggle' | 'navigation' | 'action' | 'badge';
  value?: boolean;
  onValueChange?: (val: boolean) => void;
  onPress?: () => void;
  badgeText?: string;
  isDestructive?: boolean;
  disabled?: boolean;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  type = 'navigation',
  value = false,
  onValueChange,
  onPress,
  badgeText,
  isDestructive = false,
  disabled = false,
}) => {
  const { theme } = useTheme();

  const handlePress = () => {
    if (disabled) return;
    triggerLightHaptic();
    if (type === 'toggle' && onValueChange) {
      onValueChange(!value);
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || (!onPress && type !== 'toggle')}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          opacity: disabled ? 0.5 : pressed && (onPress || type === 'toggle') ? 0.75 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor:
              iconBgColor ||
              (isDestructive
                ? 'rgba(239, 68, 68, 0.1)'
                : theme.primaryLight),
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={iconColor || (isDestructive ? theme.danger : theme.primary)}
        />
      </View>

      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            { color: isDestructive ? theme.danger : theme.text },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightContainer}>
        {type === 'toggle' && (
          <Switch
            value={value}
            onValueChange={(val) => {
              triggerLightHaptic();
              onValueChange?.(val);
            }}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFFFFF"
            disabled={disabled}
          />
        )}

        {type === 'badge' && badgeText && (
          <View style={[styles.badge, { backgroundColor: theme.surfaceVariant }]}>
            <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
              {badgeText}
            </Text>
          </View>
        )}

        {type === 'navigation' && (
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  rightContainer: {
    marginLeft: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
