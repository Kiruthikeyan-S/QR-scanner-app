import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { typography, borderRadius, spacing } from '../theme/typography';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { Badge } from '../components/Badge';
import { AppIcon } from '../components/AppIcon';
import { useNetwork } from '../hooks/useNetwork';
import { apiFetch, getBaseApiUrl } from '../api/client';
import { triggerLightHaptic, triggerFeedback } from '../utils/feedback';

export const NetworkCheckerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const network = useNetwork();

  const [checkingBackend, setCheckingBackend] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'untested'>('untested');
  const [backendUrl, setBackendUrl] = useState<string>('http://localhost:8000');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    getBaseApiUrl().then(setBackendUrl);
  }, []);

  const handleCheckAgain = async () => {
    triggerLightHaptic();
    await network.refresh();

    setCheckingBackend(true);
    const startTime = Date.now();
    const res = await apiFetch<{ status: string }>('/health');
    const elapsed = Date.now() - startTime;
    setCheckingBackend(false);

    if (res.data?.status === 'ok') {
      setBackendStatus('online');
      setLatencyMs(elapsed);
      triggerFeedback();
    } else {
      setBackendStatus('offline');
      setLatencyMs(null);
    }
  };

  const isOnline = network.isConnected && network.networkType !== 'None (Offline)';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title="Network Checker"
          subtitle="Real-time connection diagnostics"
          showBack
          onBack={() => navigation.goBack()}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline Alert Hero Card */}
        {!isOnline ? (
          <View
            style={[
              styles.offlineCard,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
              },
            ]}
          >
            <View style={styles.offlineIconCircle}>
              <AppIcon name="wifi-off" size={38} color="#EF4444" />
            </View>

            <Text style={[styles.offlineTitle, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
              No Network Connection
            </Text>

            <Text style={[styles.offlineMessage, { color: theme.textSecondary }]}>
              No network, kindly enable the network and check again.
            </Text>

            <PrimaryButton
              title={network.loading ? 'Checking...' : 'Check Again'}
              icon="refresh-outline"
              loading={network.loading}
              onPress={handleCheckAgain}
              style={styles.retryBtn}
            />
          </View>
        ) : (
          /* Online Status Hero Card */
          <View
            style={[
              styles.onlineCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: theme.cardShadow,
              },
            ]}
          >
            <View style={styles.onlineHeaderRow}>
              <View style={[styles.onlineIconBox, { backgroundColor: theme.primaryLight }]}>
                <AppIcon name="wifi" size={28} color={theme.primary} />
              </View>
              <Badge label="NETWORK ACTIVE" variant="primary" size="md" />
            </View>

            <Text style={[styles.onlineTitle, { color: theme.text }]}>Network Connected</Text>
            <Text style={[styles.onlineSub, { color: theme.textSecondary }]}>
              Your device is actively connected to {network.networkType}.
            </Text>
          </View>
        )}

        {/* Network Diagnostics Card */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.detailsHeading, { color: theme.text }]}>Device Network Details</Text>

          <View style={[styles.detailRow, { borderBottomColor: theme.borderLight }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Connection Status</Text>
            <Badge
              label={isOnline ? 'ONLINE' : 'DISCONNECTED'}
              variant={isOnline ? 'primary' : 'warning'}
              size="sm"
            />
          </View>

          <View style={[styles.detailRow, { borderBottomColor: theme.borderLight }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Network Type</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {network.networkType}
            </Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Device IP Address</Text>
            <View style={[styles.ipBox, { backgroundColor: theme.surfaceVariant }]}>
              <Text style={[styles.ipText, { color: theme.text }]}>
                {network.ipAddress || '0.0.0.0'}
              </Text>
            </View>
          </View>
        </View>

        {/* FastAPI Backend Diagnostics Card (Properly Styled & Formatted) */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.backendHeaderRow}>
            <Text style={[styles.detailsHeading, { color: theme.text, marginBottom: 0 }]}>
              FastAPI Backend Service
            </Text>
            <Badge
              label={
                backendStatus === 'online'
                  ? 'ONLINE'
                  : backendStatus === 'offline'
                  ? 'OFFLINE'
                  : 'UNTESTED'
              }
              variant={
                backendStatus === 'online'
                  ? 'primary'
                  : backendStatus === 'offline'
                  ? 'warning'
                  : 'neutral'
              }
              size="sm"
            />
          </View>

          <View style={[styles.backendUrlBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.borderLight }]}>
            <Text style={[styles.backendUrlLabel, { color: theme.textSecondary }]}>Target Endpoint:</Text>
            <Text style={[styles.backendUrlText, { color: theme.text }]} numberOfLines={1}>
              {backendUrl}/health
            </Text>
          </View>

          <View style={styles.backendStatusContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      backendStatus === 'online'
                        ? theme.primary
                        : backendStatus === 'offline'
                        ? theme.danger
                        : theme.textMuted,
                  },
                ]}
              />
              <Text style={[styles.backendStatusText, { color: theme.text }]}>
                {checkingBackend
                  ? 'Pinging server...'
                  : backendStatus === 'online'
                  ? `Connected (${latencyMs || 0}ms response)`
                  : backendStatus === 'offline'
                  ? 'Unreachable (App operates 100% offline)'
                  : 'Ready for connectivity test'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <PrimaryButton
          title="Refresh Diagnostics"
          icon="refresh-outline"
          loading={network.loading || checkingBackend}
          onPress={handleCheckAgain}
          style={{ marginBottom: spacing.md }}
        />

        {/* Offline Engine Info Banner */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.surfaceHighlight,
              borderColor: theme.primaryLight,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <AppIcon name="shield-checkmark" size={18} color={theme.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>100% Offline Engine</Text>
          </View>
          <Text style={[styles.infoCardText, { color: theme.textSecondary }]}>
            QR Smart operates completely on-device. All QR code camera scanning, vector generation, history, and saved codes work without an internet connection.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  offlineCard: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1.5,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  offlineIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  offlineTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  offlineMessage: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.lineHeight.sm,
    maxWidth: 280,
    marginBottom: spacing.xl,
  },
  retryBtn: {
    width: '100%',
    maxWidth: 240,
  },
  onlineCard: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    elevation: 3,
  },
  onlineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  onlineIconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  onlineSub: {
    fontSize: typography.fontSize.sm,
  },
  detailsCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  detailsHeading: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  ipBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  ipText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.medium,
  },
  backendHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backendUrlBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  backendUrlLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  backendUrlText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.mono,
  },
  backendStatusContainer: {
    paddingTop: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  backendStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  infoCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  infoCardTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  infoCardText: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },
});
