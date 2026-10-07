import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../hooks/useNetwork';
import { useTheme } from '../theme/ThemeContext';
import { typography, borderRadius, spacing } from '../theme/typography';
import { AppIcon } from './AppIcon';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { triggerLightHaptic, triggerFeedback } from '../utils/feedback';

export const NetworkGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const network = useNetwork();
  const [offlineDismissed, setOfflineDismissed] = useState(false);

  const isDisconnected = !network.loading && (!network.isConnected || network.networkType === 'None (Offline)');

  // Auto-reset dismissed state when connection returns
  useEffect(() => {
    if (!isDisconnected) {
      setOfflineDismissed(false);
    }
  }, [isDisconnected]);

  const handleCheckAgain = async () => {
    triggerLightHaptic();
    await network.refresh();
    if (network.isConnected && network.networkType !== 'None (Offline)') {
      triggerFeedback();
    }
  };

  const showModal = isDisconnected && !offlineDismissed;

  return (
    <View style={StyleSheet.absoluteFill}>
      {children}

      <Modal
        visible={showModal}
        animationType="fade"
        transparent={false}
        statusBarTranslucent
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.background,
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
        >
          {/* Disconnected Illustration & Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
              },
            ]}
          >
            <View style={styles.iconCircle}>
              <AppIcon name="wifi-off" size={44} color="#EF4444" />
            </View>

            <Text style={[styles.title, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
              No Network Connection
            </Text>

            <Text style={[styles.message, { color: theme.textSecondary }]}>
              No network, kindly enable the network and check again.
            </Text>

            <PrimaryButton
              title={network.loading ? 'Checking...' : 'Check Again'}
              icon="refresh-outline"
              loading={network.loading}
              onPress={handleCheckAgain}
              style={styles.actionBtn}
            />

            <SecondaryButton
              title="Continue in Offline Mode"
              variant="ghost"
              onPress={() => {
                triggerLightHaptic();
                setOfflineDismissed(true);
              }}
              style={styles.offlineBtn}
            />
          </View>

          {/* Quick Offline Tip */}
          <View
            style={[
              styles.tipBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <AppIcon name="shield-checkmark" size={16} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.tipTitle, { color: theme.text }]}>Offline QR Engine</Text>
            </View>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              QR Smart's camera scanner and QR generator do not require an internet connection and remain 100% active on your device.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1.5,
    padding: spacing['2xl'],
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: typography.lineHeight.base,
    maxWidth: 290,
    marginBottom: spacing['2xl'],
  },
  actionBtn: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  offlineBtn: {
    width: '100%',
  },
  tipBox: {
    width: '100%',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  tipTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  tipText: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },
});
