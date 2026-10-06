import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../theme/typography';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.surfaceHighlight }]}>
        <Ionicons name={icon} size={40} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>

      {actionTitle && onAction && (
        <PrimaryButton
          title={actionTitle}
          onPress={onAction}
          size="md"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    marginTop: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.lineHeight.sm,
    maxWidth: 280,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    minWidth: 160,
  },
});
