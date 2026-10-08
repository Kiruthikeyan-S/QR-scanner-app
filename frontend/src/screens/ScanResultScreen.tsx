import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../theme/ThemeContext';
import { typography, borderRadius, spacing } from '../theme/typography';
import { palette } from '../theme/colors';
import { parseQRData } from '../utils/qrParser';
import { ResultCard } from '../components/ResultCard';
import { URLSafetyCard } from '../components/URLSafetyCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { ActionHandler } from '../utils/actionHandler';
import { SavedQRStorage } from '../storage/savedQRStorage';
import { triggerFeedback, triggerLightHaptic } from '../utils/feedback';
import { checkURLSafety, analyzeURLLocal } from '../utils/urlSafety';
import { URLSafetyDetails } from '../types/qr';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'ScanResult'>;

export const ScanResultScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();

  const { data, scannedAt, safetyResult: initialSafety } = route.params;
  const details = parseQRData(data);

  const [safety, setSafety] = useState<URLSafetyDetails | null>(
    initialSafety || (details.type === 'url' ? analyzeURLLocal(details.raw) : null)
  );
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveTitle, setSaveTitle] = useState(details.title || 'My Scanned QR');
  const [isSaved, setIsSaved] = useState(false);

  // If safety info wasn't passed directly and it's a URL, perform check
  useEffect(() => {
    if (details.type === 'url' && !initialSafety) {
      checkURLSafety(details.raw).then((res) => {
        setSafety(res);
      });
    }
  }, [details.type, details.raw, initialSafety]);

  const handleOpenUrlWithConfirmation = (url: string, isUnsafe: boolean) => {
    triggerLightHaptic();
    if (isUnsafe) {
      Alert.alert(
        '⚠ Security Warning',
        `Are you sure?\n\nThis link has been flagged as potentially dangerous or deceptive (${safety?.domain || 'unknown'}).\n\nContinuing may expose your device or data to risks.`,
        [
          { text: 'Go Back (Safe)', style: 'cancel' },
          {
            text: 'Open Anyway',
            style: 'destructive',
            onPress: () => ActionHandler.openUrl(url),
          },
        ]
      );
    } else if (safety?.status === 'suspicious') {
      Alert.alert(
        'Suspicious Link Notice',
        `We could not verify the security of this website (${safety?.domain}).\n\nContinue only if you trust the source.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Link',
            onPress: () => ActionHandler.openUrl(url),
          },
        ]
      );
    } else if (safety?.status === 'unknown') {
      Alert.alert(
        'Safety Check Unavailable',
        `This link could not be verified online. Open only if you recognize and trust ${safety?.domain || 'this destination'}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open with Caution',
            onPress: () => ActionHandler.openUrl(url),
          },
        ]
      );
    } else {
      // Safe URL
      Alert.alert(
        'Open Website',
        `Open verified website in browser?\n\n${details.raw}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Website',
            onPress: () => ActionHandler.openUrl(url),
          },
        ]
      );
    }
  };

  const handlePrimaryAction = async () => {
    triggerLightHaptic();
    if (details.type === 'url') {
      const isUnsafe = safety?.status === 'unsafe';
      const targetUrl = safety?.normalizedUrl || details.raw;
      handleOpenUrlWithConfirmation(targetUrl, isUnsafe);
      return;
    }

    switch (details.primaryAction.actionType) {
      case 'call':
        await ActionHandler.callPhone(details.raw);
        break;
      case 'email':
        await ActionHandler.sendEmail(details.raw);
        break;
      case 'sms':
        await ActionHandler.sendSMS(details.raw);
        break;
      case 'map':
        await ActionHandler.openMap(details.raw);
        break;
      case 'copy':
      default:
        const ok = await ActionHandler.copyToClipboard(details.raw);
        if (ok) {
          Alert.alert('Copied', 'Content copied to clipboard successfully.');
        }
        break;
    }
  };

  const handleShare = async () => {
    triggerLightHaptic();
    await ActionHandler.shareText(`Scanned QR: ${details.title}`, details.raw);
  };

  const handleSaveToMyQRs = async () => {
    if (details.type === 'url' && safety && safety.status !== 'safe') {
      Alert.alert(
        'Cannot Save Link',
        'This link was flagged as unsafe or unverified and cannot be saved to your collection.'
      );
      setSaveModalVisible(false);
      return;
    }

    if (!saveTitle.trim()) {
      Alert.alert('Invalid Title', 'Please enter a valid title for this QR code.');
      return;
    }
    await SavedQRStorage.add({
      name: saveTitle.trim(),
      type: details.type,
      data: details.raw,
    });
    setSaveModalVisible(false);
    setIsSaved(true);
    triggerFeedback();
    Alert.alert('Saved', 'QR code saved to your collection!');
  };

  const isUnsafeURL = details.type === 'url' && safety?.status === 'unsafe';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title={isUnsafeURL ? 'Security Warning' : 'Scan Result'}
          subtitle={isUnsafeURL ? 'Threat detected in link' : 'Decoded data details'}
          showBack
          onBack={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
          rightAction={
            !isUnsafeURL
              ? {
                  icon: 'share-social-outline',
                  onPress: handleShare,
                }
              : undefined
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Render URL Safety Card for URLs, or ResultCard for non-URLs */}
        {details.type === 'url' && safety ? (
          <URLSafetyCard safety={safety} />
        ) : (
          <ResultCard details={details} scannedAt={scannedAt} style={styles.resultCard} />
        )}

        {/* Action Buttons for UNSAFE URLs */}
        {isUnsafeURL ? (
          <View style={styles.unsafeActionsContainer}>
            {/* Primary / Safe Option: Go Back */}
            <PrimaryButton
              title="Go Back (Recommended)"
              icon="arrow-back"
              onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
              style={styles.primaryBtn}
            />

            {/* Secondary Option: Open Anyway */}
            <SecondaryButton
              title="Open Anyway (High Risk)"
              icon="warning-outline"
              variant="outline"
              color="danger"
              onPress={() => handleOpenUrlWithConfirmation(safety.normalizedUrl, true)}
              style={{ marginTop: spacing.xs }}
            />

            <SecondaryButton
              title="Scan Another Code"
              icon="scan-outline"
              variant="ghost"
              onPress={() => navigation.replace('Scanner')}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        ) : (
          /* Normal Action Buttons for Safe URLs & Non-URL QR Codes */
          <>
            {/* Primary Action Button */}
            <PrimaryButton
              title={
                details.type === 'url'
                  ? safety?.status === 'suspicious'
                    ? 'Open Website (Caution)'
                    : safety?.status === 'unknown'
                    ? 'Open with Caution'
                    : 'Open Website'
                  : details.primaryAction.label
              }
              icon={details.type === 'url' ? 'open-outline' : (details.primaryAction.icon as any)}
              onPress={handlePrimaryAction}
              style={styles.primaryBtn}
            />

            {/* Secondary Actions Grid */}
            <View style={styles.actionButtonsGrid}>
              <SecondaryButton
                title="Scan Again"
                icon="scan-outline"
                variant="outline"
                onPress={() => navigation.replace('Scanner')}
                style={styles.actionGridBtn}
              />

              {(!safety || safety.status === 'safe') && (
                <SecondaryButton
                  title={isSaved ? 'Saved' : 'Save QR'}
                  icon={isSaved ? 'bookmark' : 'bookmark-outline'}
                  variant="outline"
                  color={isSaved ? 'primary' : 'neutral'}
                  onPress={() => setSaveModalVisible(true)}
                  style={styles.actionGridBtn}
                />
              )}

              {safety && safety.status !== 'safe' && (
                <SecondaryButton
                  title="Copy Link"
                  icon="copy-outline"
                  variant="outline"
                  onPress={async () => {
                    triggerLightHaptic();
                    const ok = await ActionHandler.copyToClipboard(details.raw);
                    if (ok) Alert.alert('Copied', 'URL copied to clipboard.');
                  }}
                  style={styles.actionGridBtn}
                />
              )}
            </View>

            {(!safety || safety.status === 'safe') && (
              <SecondaryButton
                title="Create QR from this data"
                icon="qr-code-outline"
                variant="tinted"
                color="secondary"
                onPress={() =>
                  navigation.navigate('QRPreview', {
                    type: details.type,
                    data: details.raw,
                    title: details.title,
                  })
                }
                style={{ marginTop: spacing.md }}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Save Modal */}
      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Save QR Code</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Give this QR code a title to easily find it in your saved collection.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              value={saveTitle}
              onChangeText={setSaveTitle}
              placeholder="e.g. Office Wi-Fi or Event Link"
              placeholderTextColor={theme.textMuted}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <SecondaryButton
                title="Cancel"
                variant="ghost"
                onPress={() => setSaveModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Save Code"
                onPress={handleSaveToMyQRs}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  resultCard: {
    marginBottom: spacing.base,
  },
  primaryBtn: {
    marginBottom: spacing.md,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionGridBtn: {
    flex: 1,
  },
  unsafeActionsContainer: {
    marginTop: spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    elevation: 5,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
