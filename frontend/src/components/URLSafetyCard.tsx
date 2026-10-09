import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { URLSafetyDetails } from '../types/qr';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius, spacing } from '../theme/typography';
import { ActionHandler } from '../utils/actionHandler';
import { triggerLightHaptic } from '../utils/feedback';

interface URLSafetyCardProps {
  safety: URLSafetyDetails;
  onCopyUrl?: () => void;
}

export const URLSafetyCard: React.FC<URLSafetyCardProps> = ({ safety, onCopyUrl }) => {
  const { theme, isDark } = useTheme();
  const isUnsafe = safety.status === 'unsafe';
  const isSuspicious = safety.status === 'suspicious';
  const hasThreat = isUnsafe || isSuspicious;

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
          borderColor: hasThreat
            ? isUnsafe
              ? palette.rose[500]
              : palette.amber[500]
            : theme.border,
        },
      ]}
    >
      {/* If Threat Detected: Show concise warning header without decorative sparkles */}
      {hasThreat ? (
        <View
          style={[
            styles.warningHeader,
            {
              backgroundColor: isUnsafe
                ? isDark
                  ? 'rgba(239, 68, 68, 0.15)'
                  : palette.rose[50]
                : isDark
                ? 'rgba(245, 158, 11, 0.15)'
                : palette.amber[50],
              borderBottomColor: isUnsafe ? palette.rose[500] : palette.amber[500],
            },
          ]}
        >
          <Text
            style={[
              styles.warningTitle,
              { color: isUnsafe ? palette.rose[600] : palette.amber[600] },
            ]}
          >
            {isUnsafe ? 'Unsafe Link Detected' : 'Suspicious Link'}
          </Text>
          <Text style={[styles.warningSubtext, { color: theme.textSecondary }]}>
            {isUnsafe
              ? 'This website may be dangerous or deceptive.'
              : 'This website could not be verified. Proceed with caution.'}
          </Text>
        </View>
      ) : null}

      {/* Main Clean Domain & URL Body */}
      <View style={styles.body}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Website</Text>
        <Text style={[styles.domainText, { color: theme.text }]} numberOfLines={1}>
          {safety.domain || 'Website'}
        </Text>

        <View
          style={[
            styles.urlBox,
            { backgroundColor: theme.surfaceVariant, borderColor: theme.borderLight },
          ]}
        >
          <Text style={[styles.urlText, { color: theme.text }]} numberOfLines={3} selectable>
            {safety.normalizedUrl}
          </Text>
        </View>

        {/* Threat Reasons list if unsafe */}
        {hasThreat && safety.reasons && safety.reasons.length > 0 && (
          <View style={styles.reasonsList}>
            <Text
              style={[
                styles.reasonsHeading,
                { color: isUnsafe ? palette.rose[600] : palette.amber[600] },
              ]}
            >
              Detected issues:
            </Text>
            {safety.reasons.map((reason, idx) => (
              <Text key={idx} style={[styles.reasonItem, { color: theme.textSecondary }]}>
                • {reason}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.base,
  },
  warningHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  warningTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  warningSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  domainText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  urlBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  urlText: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  reasonsList: {
    marginTop: spacing.md,
  },
  reasonsHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  reasonItem: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
});
