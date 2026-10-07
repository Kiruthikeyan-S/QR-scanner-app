import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScanRecord } from '../types/qr';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { QR_TYPES } from '../constants/config';
import { typography, borderRadius, spacing } from '../theme/typography';
import { triggerLightHaptic } from '../utils/feedback';

interface HistoryCardProps {
  item: ScanRecord;
  isSelectionMode: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  item,
  isSelectionMode,
  isSelected,
  onPress,
  onLongPress,
}) => {
  const { theme, isDark } = useTheme();
  const meta = QR_TYPES[item.type] || QR_TYPES.text;

  const dateObj = new Date(item.scanned_at);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-GB', { month: 'short' });
  const time = dateObj
    .toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();

  const formattedDateTime = `${day} ${month}, ${time}`;

  return (
    <Pressable
      onPress={() => {
        triggerLightHaptic();
        onPress();
      }}
      onLongPress={() => {
        triggerLightHaptic();
        onLongPress();
      }}
      delayLongPress={280}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isSelected
            ? isDark
              ? 'rgba(16, 185, 129, 0.15)'
              : palette.emerald[50]
            : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.cardContent}>
        {isSelectionMode && (
          <View style={styles.checkboxContainer}>
            {isSelected ? (
              <Ionicons name="checkbox" size={22} color={theme.primary} />
            ) : (
              <Ionicons name="square-outline" size={22} color={theme.textMuted} />
            )}
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={[styles.typeText, { color: theme.text }]}>
            {meta.label.toUpperCase()}
          </Text>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {formattedDateTime}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.sm + 2,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  typeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
