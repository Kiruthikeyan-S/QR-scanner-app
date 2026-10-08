import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScanRecord } from '../types/qr';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { QR_TYPES } from '../constants/config';
import { typography, borderRadius, spacing } from '../theme/typography';
import { triggerLightHaptic } from '../utils/feedback';
import { ActionHandler } from '../utils/actionHandler';

interface HistoryCardProps {
  item: ScanRecord;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
  onCopySuccess?: () => void;
}

const formatHistoryDate = (isoString: string): string => {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase();

  if (isToday) {
    return `Today, ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  const day = date.getDate();
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  return `${day} ${month}, ${timeStr}`;
};

export const HistoryCard: React.FC<HistoryCardProps> = ({
  item,
  isSelected = false,
  isSelectionMode = false,
  onPress,
  onLongPress,
  onDelete,
  onCopySuccess,
}) => {
  const { theme, isDark } = useTheme();
  const meta = QR_TYPES[item.type] || QR_TYPES.text;
  const formattedTime = formatHistoryDate(item.scanned_at);

  const handleCopy = async () => {
    triggerLightHaptic();
    const ok = await ActionHandler.copyToClipboard(item.data);
    if (ok && onCopySuccess) {
      onCopySuccess();
    }
  };

  const handleShare = async () => {
    triggerLightHaptic();
    await ActionHandler.shareText(`QR Content (${meta.label})`, item.data);
  };

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
      delayLongPress={250}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isSelected
            ? isDark
              ? 'rgba(16, 185, 129, 0.14)'
              : 'rgba(16, 185, 129, 0.08)'
            : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
          shadowColor: theme.cardShadow,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.topRow}>
        {/* Selection Indicator Checkbox */}
        {isSelectionMode && (
          <View style={styles.selectionIndicator}>
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: isSelected ? theme.primary : theme.border,
                  backgroundColor: isSelected ? theme.primary : 'transparent',
                },
              ]}
            >
              {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
          </View>
        )}

        {/* QR Type Icon */}
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isDark ? meta.badgeBgDark : meta.badgeBgLight,
            },
          ]}
        >
          <Ionicons name={meta.iconName as any} size={20} color={meta.color} />
        </View>

        {/* Content Preview */}
        <View style={styles.titleArea}>
          <View style={styles.typeBadgeRow}>
            <View style={styles.typeBadgeLeft}>
              <Text style={[styles.typeBadge, { color: meta.color }]}>{meta.label}</Text>
              {item.type === 'url' && (
                <View style={[styles.safeBadge, { backgroundColor: palette.emerald[500] + '18' }]}>
                  <Ionicons name="shield-checkmark" size={10} color={palette.emerald[500]} />
                  <Text style={[styles.safeBadgeText, { color: palette.emerald[500] }]}>Safe</Text>
                </View>
              )}
            </View>
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>{formattedTime}</Text>
          </View>
          <Text style={[styles.dataPreview, { color: theme.text }]} numberOfLines={2}>
            {item.data}
          </Text>
        </View>
      </View>

      {/* Normal Mode Actions Bar (Icon-only) */}
      {!isSelectionMode && (
        <View style={[styles.bottomActions, { borderTopColor: theme.borderLight }]}>
          <Pressable
            onPress={handleCopy}
            accessibilityLabel="Copy history item"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.iconActionBtn,
              { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="copy-outline" size={16} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            onPress={handleShare}
            accessibilityLabel="Share history item"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.iconActionBtn,
              { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="share-social-outline" size={16} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => {
              triggerLightHaptic();
              onDelete();
            }}
            accessibilityLabel="Delete history item"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.iconActionBtn,
              { backgroundColor: 'rgba(239, 68, 68, 0.08)', opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color={theme.danger} />
          </Pressable>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.md,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  selectionIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  titleArea: {
    flex: 1,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typeBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  safeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  safeBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
  },
  dataPreview: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.sm,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
