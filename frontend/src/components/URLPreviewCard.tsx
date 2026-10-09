import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { CustomQRCode } from './CustomQRCode';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius, spacing } from '../theme/typography';
import { AppIcon } from './AppIcon';
import { Badge } from './Badge';
import { triggerLightHaptic } from '../utils/feedback';

interface URLPreviewCardProps {
  url: string;
  onSelectShortcut: (text: string) => void;
  onClear: () => void;
  style?: ViewStyle;
}

export const URLPreviewCard: React.FC<URLPreviewCardProps> = ({
  url,
  onSelectShortcut,
  onClear,
  style,
}) => {
  const { theme, isDark } = useTheme();

  const trimmed = (url || '').trim();

  // Normalize
  let normalized = trimmed;
  if (trimmed && !/^https?:\/\//i.test(trimmed) && !/^ftp:\/\//i.test(trimmed)) {
    normalized = `https://${trimmed}`;
  }

  // Domain extraction
  let domain = '';
  let isValidDomain = false;
  try {
    if (trimmed.length > 3 && trimmed.includes('.')) {
      const urlObj = new URL(normalized);
      domain = urlObj.hostname;
      isValidDomain = Boolean(domain && domain.includes('.'));
    }
  } catch (e) {
    domain = normalized.replace(/^https?:\/\//, '').split('/')[0];
    isValidDomain = domain.length > 3 && domain.includes('.');
  }

  const handlePaste = async () => {
    triggerLightHaptic();
    const clip = await Clipboard.getStringAsync();
    if (clip) {
      onSelectShortcut(clip.trim());
    }
  };

  const shortcuts = [
    { label: 'https://', value: 'https://' },
    { label: 'www.', value: 'www.' },
    { label: '.com', value: '.com' },
    { label: '.org', value: '.org' },
    { label: '.io', value: '.io' },
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Quick Helper Chips */}
      <View style={styles.shortcutsRow}>
        <Pressable
          onPress={handlePaste}
          style={[styles.shortcutChip, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
        >
          <AppIcon name="copy-outline" size={13} color={theme.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.shortcutText, { color: theme.primary, fontWeight: 'bold' }]}>Paste</Text>
        </Pressable>

        {shortcuts.map((sc) => (
          <Pressable
            key={sc.label}
            onPress={() => {
              triggerLightHaptic();
              onSelectShortcut(sc.value);
            }}
            style={[styles.shortcutChip, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
          >
            <Text style={[styles.shortcutText, { color: theme.text }]}>{sc.label}</Text>
          </Pressable>
        ))}

        {trimmed.length > 0 && (
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              onClear();
            }}
            style={[styles.shortcutChip, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: theme.danger }]}
          >
            <AppIcon name="close" size={13} color={theme.danger} style={{ marginRight: 2 }} />
            <Text style={[styles.shortcutText, { color: theme.danger }]}>Clear</Text>
          </Pressable>
        )}
      </View>

      {/* Live Preview Card (when URL is entered) */}
      {trimmed.length > 0 && (
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: theme.surface,
              borderColor: isValidDomain ? theme.primary : theme.border,
              shadowColor: theme.cardShadow,
            },
          ]}
        >
          <View style={styles.previewTop}>
            <View style={styles.previewInfoLeft}>
              <View style={styles.badgeRow}>
                <Badge
                  label={isValidDomain ? 'VALID URL FORMAT' : 'ENTER DOMAIN'}
                  variant={isValidDomain ? 'primary' : 'warning'}
                  size="sm"
                />
                <Text style={[styles.protocolText, { color: theme.textSecondary }]}>
                  {normalized.startsWith('https') ? 'HTTPS (Secure)' : 'HTTP'}
                </Text>
              </View>

              <Text style={[styles.domainTitle, { color: theme.text }]} numberOfLines={1}>
                {domain || 'Website URL'}
              </Text>

              <View style={[styles.urlBox, { backgroundColor: theme.surfaceVariant }]}>
                <Text style={[styles.urlText, { color: theme.textSecondary }]} numberOfLines={2}>
                  {normalized}
                </Text>
              </View>
            </View>

            {/* Instant Live QR Thumbnail powered by qrcodegen */}
            <View style={[styles.qrThumb, { backgroundColor: '#FFFFFF', borderColor: theme.borderLight }]}>
              <CustomQRCode
                value={normalized || 'https://qrsmart.app'}
                size={56}
                showContrastWarning={false}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  shortcutsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },
  previewCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    padding: spacing.md,
    elevation: 2,
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewInfoLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  protocolText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  domainTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  urlBox: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  urlText: {
    fontFamily: typography.fontFamily.mono,
    fontSize: 11,
  },
  qrThumb: {
    padding: 6,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
