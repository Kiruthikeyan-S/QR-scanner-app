import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { URLSafetyDetails, URLSafetyStatus } from '../types/qr';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius, spacing } from '../theme/typography';
import { AppIcon } from './AppIcon';
import { ActionHandler } from '../utils/actionHandler';
import { triggerLightHaptic } from '../utils/feedback';

interface URLSafetyCardProps {
  safety: URLSafetyDetails;
  onCopyUrl?: () => void;
}

export const URLSafetyCard: React.FC<URLSafetyCardProps> = ({ safety, onCopyUrl }) => {
  const { theme, isDark } = useTheme();

  const getStatusConfig = (status: URLSafetyStatus) => {
    switch (status) {
      case 'safe':
        return {
          title: 'Link appears safe',
          badgeText: 'SAFE',
          icon: 'shield-checkmark',
          accentColor: palette.emerald[500],
          bgColor: isDark ? 'rgba(16, 185, 129, 0.12)' : palette.emerald[50],
          borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : palette.emerald[200],
          subtext: 'This link passed reputation and security threat checks.',
        };
      case 'suspicious':
        return {
          title: 'Suspicious Link',
          badgeText: 'SUSPICIOUS',
          icon: 'alert-circle',
          accentColor: palette.amber[500],
          bgColor: isDark ? 'rgba(245, 158, 11, 0.12)' : palette.amber[50],
          borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : palette.amber[100],
          subtext: 'We could not confirm that this website is safe. Exercise caution.',
        };
      case 'unsafe':
        return {
          title: 'Unsafe Link Detected',
          badgeText: 'DANGER',
          icon: 'warning',
          accentColor: palette.rose[500],
          bgColor: isDark ? 'rgba(244, 63, 94, 0.15)' : palette.rose[50],
          borderColor: isDark ? 'rgba(244, 63, 94, 0.4)' : palette.rose[100],
          subtext: 'This website is flagged as potentially dangerous, deceptive, or malicious.',
        };
      case 'unknown':
      default:
        return {
          title: 'Safety check unavailable',
          badgeText: 'UNVERIFIED',
          icon: 'help-circle-outline',
          accentColor: palette.slate[400],
          bgColor: isDark ? 'rgba(148, 163, 184, 0.12)' : palette.slate[100],
          borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : palette.slate[300],
          subtext: 'We could not verify this website online. Open only if you trust the source.',
        };
    }
  };

  const config = getStatusConfig(safety.status);

  const handleCopy = async () => {
    triggerLightHaptic();
    if (onCopyUrl) {
      onCopyUrl();
    } else {
      await ActionHandler.copyToClipboard(safety.normalizedUrl);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: config.borderColor,
        },
      ]}
    >
      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: config.bgColor, borderBottomColor: config.borderColor }]}>
        <View style={styles.headerLeft}>
          <Ionicons name={config.icon as any} size={24} color={config.accentColor} style={{ marginRight: 8 }} />
          <View>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>{config.title}</Text>
            <Text style={[styles.bannerSubtext, { color: theme.textSecondary }]}>{config.subtext}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: config.accentColor + '20', borderColor: config.accentColor }]}>
          <Text style={[styles.badgeText, { color: config.accentColor }]}>{config.badgeText}</Text>
        </View>
      </View>

      {/* Domain & URL Information */}
      <View style={styles.contentSection}>
        {/* Domain Display */}
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Website Domain</Text>
          <Text style={[styles.domainText, { color: theme.text }]} numberOfLines={1}>
            {safety.domain || 'Unknown Domain'}
          </Text>
        </View>

        {/* Full URL with Copy button */}
        <View style={styles.infoRow}>
          <View style={styles.labelWithCopy}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Full URL</Text>
            <Pressable onPress={handleCopy} hitSlop={8} style={styles.copyPill}>
              <Ionicons name="copy-outline" size={13} color={theme.primary} />
              <Text style={[styles.copyPillText, { color: theme.primary }]}>Copy</Text>
            </Pressable>
          </View>
          <View style={[styles.urlBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
            <Text style={[styles.urlText, { color: theme.text }]} numberOfLines={3} selectable>
              {safety.normalizedUrl}
            </Text>
          </View>
        </View>

        {/* Reasons / Flags (For suspicious / unsafe / unknown) */}
        {safety.reasons && safety.reasons.length > 0 && safety.status !== 'safe' && (
          <View style={[styles.reasonsBox, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
            <Text style={[styles.reasonsHeading, { color: config.accentColor }]}>Security Details:</Text>
            {safety.reasons.map((reason, idx) => (
              <View key={idx} style={styles.reasonItem}>
                <Ionicons name="ellipse" size={6} color={config.accentColor} style={{ marginTop: 5, marginRight: 6 }} />
                <Text style={[styles.reasonText, { color: theme.text }]}>{reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Critical Danger Warning Banner for UNSAFE */}
        {safety.status === 'unsafe' && (
          <View style={[styles.dangerWarningBox, { backgroundColor: palette.rose[500] + '18', borderColor: palette.rose[500] }]}>
            <Ionicons name="alert-circle" size={20} color={palette.rose[500]} style={{ marginRight: 8 }} />
            <Text style={[styles.dangerWarningText, { color: isDark ? '#FDA4AF' : palette.rose[600] }]}>
              Do not enter passwords, payment details, OTP codes, or personal information on this site.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: spacing.base,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.sm,
  },
  bannerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  bannerSubtext: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  contentSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  domainText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  labelWithCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  copyPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  urlBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  urlText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono,
    lineHeight: typography.lineHeight.sm,
  },
  reasonsBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: 6,
  },
  reasonsHeading: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reasonText: {
    fontSize: typography.fontSize.xs,
    flex: 1,
    lineHeight: typography.lineHeight.xs,
  },
  dangerWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  dangerWarningText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
    lineHeight: typography.lineHeight.xs,
  },
});
