import React, { useState } from 'react';
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
import { parseQRData } from '../utils/qrParser';
import { ResultCard } from '../components/ResultCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { ActionHandler } from '../utils/actionHandler';
import { SavedQRStorage } from '../storage/savedQRStorage';
import { triggerFeedback, triggerLightHaptic } from '../utils/feedback';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'ScanResult'>;

export const ScanResultScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();

  const { data, scannedAt } = route.params;
  const details = parseQRData(data);

  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveTitle, setSaveTitle] = useState(details.title || 'My Scanned QR');
  const [isSaved, setIsSaved] = useState(false);

  const handlePrimaryAction = async () => {
    triggerLightHaptic();
    switch (details.primaryAction.actionType) {
      case 'open_url':
        Alert.alert(
          'Open External Link',
          `Are you sure you want to open this website?\n\n${details.raw}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Link',
              onPress: () => ActionHandler.openUrl(details.raw),
            },
          ]
        );
        break;
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title="Scan Result"
          subtitle="Decoded data details"
          showBack
          onBack={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
          rightAction={{
            icon: 'share-social-outline',
            onPress: handleShare,
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Parsed Result Card */}
        <ResultCard details={details} scannedAt={scannedAt} style={styles.resultCard} />

        {/* Security Notice for URLs */}
        {details.type === 'url' && (
          <View
            style={[
              styles.securityBanner,
              { backgroundColor: theme.surfaceHighlight, borderColor: theme.primaryLight },
            ]}
          >
            <Ionicons name="shield-checkmark" size={18} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.securityText, { color: theme.textSecondary }]}>
              Verified link format. QR Smart never auto-opens URLs without your explicit action.
            </Text>
          </View>
        )}

        {/* Primary Action Button */}
        <PrimaryButton
          title={details.primaryAction.label}
          icon={details.primaryAction.icon as any}
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

          <SecondaryButton
            title={isSaved ? 'Saved' : 'Save QR'}
            icon={isSaved ? 'bookmark' : 'bookmark-outline'}
            variant="outline"
            color={isSaved ? 'primary' : 'neutral'}
            onPress={() => setSaveModalVisible(true)}
            style={styles.actionGridBtn}
          />
        </View>

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
      </ScrollView>

      {/* Save Modal */}
      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  securityText: {
    fontSize: typography.fontSize.xs,
    flex: 1,
    lineHeight: typography.lineHeight.xs,
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
