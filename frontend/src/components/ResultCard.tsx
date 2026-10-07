import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParsedQRDetails } from '../types/qr';
import { useTheme } from '../theme/ThemeContext';
import { QR_TYPES } from '../constants/config';
import { typography, borderRadius, spacing } from '../theme/typography';
import { ActionHandler } from '../utils/actionHandler';
import { triggerLightHaptic } from '../utils/feedback';

interface ResultCardProps {
  details: ParsedQRDetails;
  scannedAt?: string;
  style?: ViewStyle;
}

export const ResultCard: React.FC<ResultCardProps> = ({ details, scannedAt, style }) => {
  const { theme, isDark } = useTheme();
  const [showSensitive, setShowSensitive] = useState<Record<number, boolean>>({});
  const [copiedField, setCopiedField] = useState<number | null>(null);

  const meta = QR_TYPES[details.type] || QR_TYPES.text;

  const toggleSensitive = (index: number) => {
    triggerLightHaptic();
    setShowSensitive((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const copyFieldValue = async (val: string, index: number) => {
    triggerLightHaptic();
    const ok = await ActionHandler.copyToClipboard(val);
    if (ok) {
      setCopiedField(index);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const formattedDate = scannedAt
    ? new Date(scannedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.cardShadow,
        },
        style,
      ]}
    >
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.typeInfo}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark ? meta.badgeBgDark : meta.badgeBgLight,
              },
            ]}
          >
            <Ionicons name={meta.iconName as any} size={22} color={meta.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.typeTitle, { color: theme.text }]}>{meta.label}</Text>
            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>{formattedDate}</Text>
          </View>
        </View>
      </View>

      {/* Main Content Box with Mono Typography */}
      <View style={[styles.monoBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
        <Text style={[styles.monoText, { color: theme.text }]} numberOfLines={6} selectable>
          {details.raw}
        </Text>
      </View>

      {/* Structured Fields */}
      {details.fields.length > 0 && (
        <View style={styles.fieldsContainer}>
          {details.fields.map((f, i) => {
            const isMasked = f.isSensitive && !showSensitive[i];
            const displayVal = isMasked ? '••••••••••••' : f.value;
            const isJustCopied = copiedField === i;

            return (
              <View
                key={i}
                style={[
                  styles.fieldRow,
                  { borderBottomColor: theme.borderLight },
                  i === details.fields.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.fieldLeft}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{f.label}</Text>
                  <Text style={[styles.fieldValue, { color: theme.text }]} selectable>
                    {displayVal}
                  </Text>
                </View>

                <View style={styles.fieldActions}>
                  {f.isSensitive && (
                    <Pressable
                      onPress={() => toggleSensitive(i)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.fieldActionBtn}
                    >
                      <Ionicons
                        name={showSensitive[i] ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={theme.textSecondary}
                      />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => copyFieldValue(f.value, i)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.fieldActionBtn}
                  >
                    <Ionicons
                      name={isJustCopied ? 'checkmark-outline' : 'copy-outline'}
                      size={18}
                      color={isJustCopied ? theme.primary : theme.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  typeTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  monoBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  monoText: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  fieldsContainer: {
    marginTop: spacing.xs,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  fieldLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  fieldActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldActionBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});
