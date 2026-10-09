import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomQRCode } from './CustomQRCode';
import { SavedQRRecord } from '../types/qr';
import { useTheme } from '../theme/ThemeContext';
import { QR_TYPES } from '../constants/config';
import { typography, borderRadius, spacing } from '../theme/typography';
import { triggerLightHaptic } from '../utils/feedback';
import { ActionHandler } from '../utils/actionHandler';

interface QRCardProps {
  item: SavedQRRecord;
  onPress: () => void;
  onDelete: () => void;
  onRename?: () => void;
}

export const QRCard: React.FC<QRCardProps> = ({ item, onPress, onDelete, onRename }) => {
  const { theme, isDark } = useTheme();
  const meta = QR_TYPES[item.type] || QR_TYPES.text;

  const handleShare = async () => {
    triggerLightHaptic();
    await ActionHandler.shareText(item.name, item.data);
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
      <View style={styles.contentRow}>
        {/* QR Thumbnail Preview powered by qrcodegen */}
        <View style={[styles.qrThumbBox, { backgroundColor: '#FFFFFF', borderColor: theme.borderLight }]}>
          <CustomQRCode
            value={item.data || 'https://qrsmart.app'}
            size={52}
            showContrastWarning={false}
          />
        </View>

        {/* Details */}
        <View style={styles.detailsCol}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.typeTag,
                { backgroundColor: isDark ? meta.badgeBgDark : meta.badgeBgLight },
              ]}
            >
              <Ionicons name={meta.iconName as any} size={12} color={meta.color} style={{ marginRight: 4 }} />
              <Text style={[styles.typeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={[styles.dataText, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.data}
          </Text>
        </View>
      </View>

      {/* Action Footer */}
      <View style={[styles.footer, { borderTopColor: theme.borderLight }]}>
        <Text style={[styles.dateText, { color: theme.textMuted }]}>
          {new Date(item.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </Text>

        <View style={styles.actionsGroup}>
          {onRename && (
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                onRename();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}
            >
              <Ionicons name="pencil-outline" size={17} color={theme.textSecondary} />
            </Pressable>
          )}

          <Pressable
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <Ionicons name="share-social-outline" size={17} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => {
              triggerLightHaptic();
              onDelete();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <Ionicons name="trash-outline" size={17} color={theme.danger} />
          </Pressable>
        </View>
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrThumbBox: {
    padding: 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginRight: spacing.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  typeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  dataText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.mono,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: spacing.xs,
    marginLeft: spacing.md,
  },
});
