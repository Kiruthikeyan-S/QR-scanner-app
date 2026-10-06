import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScanRecord } from '../types/qr';
import { useTheme } from '../theme/ThemeContext';
import { QR_TYPES } from '../constants/config';
import { typography, borderRadius, spacing } from '../theme/typography';
import { triggerLightHaptic } from '../utils/feedback';
import { ActionHandler } from '../utils/actionHandler';

interface HistoryCardProps {
  item: ScanRecord;
  onPress: () => void;
  onDelete: () => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ item, onPress, onDelete }) => {
  const { theme, isDark } = useTheme();
  const meta = QR_TYPES[item.type] || QR_TYPES.text;

  const dateObj = new Date(item.scanned_at);
  const formattedTime = dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = async () => {
    triggerLightHaptic();
    await ActionHandler.copyToClipboard(item.data);
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
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.cardShadow,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.topRow}>
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

        <View style={styles.titleArea}>
          <View style={styles.typeBadgeRow}>
            <Text style={[styles.typeBadge, { color: meta.color }]}>{meta.label}</Text>
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>{formattedTime}</Text>
          </View>
          <Text style={[styles.dataPreview, { color: theme.text }]} numberOfLines={2}>
            {item.data}
          </Text>
        </View>
      </View>

      <View style={[styles.bottomActions, { borderTopColor: theme.borderLight }]}>
        <Pressable onPress={handleCopy} style={styles.actionBtn}>
          <Ionicons name="copy-outline" size={15} color={theme.textSecondary} />
          <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>Copy</Text>
        </Pressable>

        <Pressable onPress={handleShare} style={styles.actionBtn}>
          <Ionicons name="share-social-outline" size={15} color={theme.textSecondary} />
          <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>Share</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            triggerLightHaptic();
            onDelete();
          }}
          style={styles.actionBtn}
        >
          <Ionicons name="trash-outline" size={15} color={theme.danger} />
          <Text style={[styles.actionBtnText, { color: theme.danger }]}>Delete</Text>
        </Pressable>
      </View>
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
  typeBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.base,
    paddingVertical: 2,
  },
  actionBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginLeft: 4,
  },
});
