import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, Image } from 'react-native';
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
  const [showFullUrl, setShowFullUrl] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const meta = QR_TYPES[details.type] || QR_TYPES.text;
  const isMedia = details.type === 'photo' || details.type === 'file';

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

  const handleCopyLink = async () => {
    triggerLightHaptic();
    const ok = await ActionHandler.copyToClipboard(details.raw);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleOpenLink = async () => {
    triggerLightHaptic();
    await ActionHandler.openUrl(details.raw);
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

  // Shorten long URLs nicely for display
  const getShortUrlDisplay = (url: string) => {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname;
      const filename = pathname.split('/').pop() || '';
      return `${parsed.hostname}/.../${filename.length > 20 ? filename.slice(0, 10) + '...' + filename.slice(-7) : filename}`;
    } catch {
      return url.length > 36 ? `${url.slice(0, 32)}...` : url;
    }
  };

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

      {/* Cloud Media / File Card Presentation */}
      {isMedia ? (
        <View style={styles.mediaContainer}>
          {details.type === 'photo' && details.raw.startsWith('http') && (
            <View style={[styles.photoCard, { borderColor: theme.borderLight }]}>
              <Image
                source={{ uri: details.raw }}
                style={styles.photoThumb}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Clean Link Options Box */}
          <View style={[styles.linkOptionsBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
            <View style={styles.linkHeaderRow}>
              <View style={styles.linkHeaderLeft}>
                <Ionicons name="link-outline" size={17} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.linkOptionHeading, { color: theme.text }]}>Link Options</Text>
              </View>
              <Pressable
                onPress={() => setShowFullUrl(!showFullUrl)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.toggleUrlText, { color: theme.primary }]}>
                  {showFullUrl ? 'Hide URL' : 'View URL'}
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.shortUrlText, { color: theme.textSecondary }]} numberOfLines={1}>
              {getShortUrlDisplay(details.raw)}
            </Text>

            {/* Quick Link Buttons Row */}
            <View style={styles.linkActionsRow}>
              <Pressable
                onPress={handleOpenLink}
                style={[styles.linkActionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Ionicons name="open-outline" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.linkActionText, { color: theme.primary }]}>Open Link</Text>
              </Pressable>

              <Pressable
                onPress={handleCopyLink}
                style={[styles.linkActionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Ionicons
                  name={copiedLink ? 'checkmark-outline' : 'copy-outline'}
                  size={14}
                  color={copiedLink ? '#059669' : theme.text}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.linkActionText, { color: copiedLink ? '#059669' : theme.text }]}>
                  {copiedLink ? 'Copied' : 'Copy Link'}
                </Text>
              </Pressable>
            </View>

            {/* Expandable Full URL (Optional view) */}
            {showFullUrl && (
              <View style={[styles.expandedUrlBox, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
                <Text style={[styles.expandedUrlText, { color: theme.text }]} selectable>
                  {details.raw}
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        /* Standard Content Box with Mono Typography for Text / Wi-Fi / Orders / JSON */
        <View style={[styles.monoBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
          <Text style={[styles.monoText, { color: theme.text }]} numberOfLines={6} selectable>
            {details.raw}
          </Text>
        </View>
      )}

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
  mediaContainer: {
    marginBottom: spacing.base,
  },
  photoCard: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.md,
    backgroundColor: '#000000',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  linkOptionsBox: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  linkHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  linkHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkOptionHeading: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleUrlText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  shortUrlText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.mono,
    marginBottom: spacing.md,
  },
  linkActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  linkActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  linkActionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  expandedUrlBox: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  expandedUrlText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.mono,
    lineHeight: typography.lineHeight.xs,
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
