import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QRTypeMetadata } from '../constants/config';
import { useTheme } from '../theme/ThemeContext';
import { typography, borderRadius, spacing } from '../theme/typography';
import { triggerLightHaptic } from '../utils/feedback';

interface QRTypeCardProps {
  item: QRTypeMetadata;
  onPress: () => void;
}

export const QRTypeCard: React.FC<QRTypeCardProps> = ({ item, onPress }) => {
  const { theme, isDark } = useTheme();

  return (
    <Pressable
      onPress={() => {
        triggerLightHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.cardShadow,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: isDark ? item.badgeBgDark : item.badgeBgLight,
          },
        ]}
      >
        <Ionicons name={item.iconName as any} size={26} color={item.color} />
      </View>

      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {item.label}
      </Text>

      {item.description ? (
        <Text
          style={[styles.description, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    flex: 1,
    margin: spacing.xs,
    minHeight: 124,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.sm + 1,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  description: {
    fontSize: typography.fontSize.xs,
    lineHeight: 14,
  },
});
