import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../theme/ThemeContext';
import { QR_TYPES } from '../constants/config';
import { typography, borderRadius, spacing } from '../theme/typography';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { Badge } from '../components/Badge';
import { SavedQRStorage } from '../storage/savedQRStorage';
import { NotificationStorage } from '../storage/notificationStorage';
import { ActionHandler } from '../utils/actionHandler';
import { triggerFeedback, triggerLightHaptic } from '../utils/feedback';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PreviewRouteProp = RouteProp<RootStackParamList, 'QRPreview'>;

export const QRPreviewScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PreviewRouteProp>();

  const { type, data, title, isSaved: initialIsSaved, savedId } = route.params;
  const meta = QR_TYPES[type] || QR_TYPES.text;

  const [isSaved, setIsSaved] = useState(Boolean(initialIsSaved));
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveTitle, setSaveTitle] = useState(title || meta.label);

  const qrRef = useRef<any>(null);

  const handleSave = async () => {
    if (isSaved) {
      Alert.alert('Already Saved', 'This QR code is already in your saved collection.');
      return;
    }
    setSaveModalVisible(true);
  };

  const confirmSave = async () => {
    if (!saveTitle.trim()) {
      Alert.alert('Invalid Name', 'Please enter a name for this QR code.');
      return;
    }

    const saved = await SavedQRStorage.add({
      name: saveTitle.trim(),
      type,
      data,
    });

    await NotificationStorage.add({
      title: 'QR Code Saved',
      message: `"${saveTitle.trim()}" (${type.toUpperCase()}) was saved to your collection.`,
      type: 'saved',
      data: { savedId: saved.id, name: saveTitle.trim(), qrType: type, data },
    });

    setSaveModalVisible(false);
    setIsSaved(true);
    triggerFeedback();
    Alert.alert('Saved Successfully', `"${saveTitle.trim()}" has been saved.`);
  };

  const handleShare = async () => {
    triggerLightHaptic();
    await ActionHandler.shareText(saveTitle, data);
  };

  const handleCopy = async () => {
    triggerLightHaptic();
    const ok = await ActionHandler.copyToClipboard(data);
    if (ok) {
      Alert.alert('Copied', 'QR data copied to clipboard.');
    }
  };

  const handleTestScan = () => {
    triggerLightHaptic();
    navigation.navigate('ScanResult', {
      data,
      type,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title="Generated QR"
          subtitle="Ready to scan and share"
          showBack
          onBack={() => navigation.goBack()}
          rightAction={{
            icon: 'share-social-outline',
            onPress: handleShare,
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Code Container Card */}
        <View
          style={[
            styles.qrCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.cardShadow,
            },
          ]}
        >
          {/* Type Badge & Status */}
          <View style={styles.cardHeader}>
            <Badge label={meta.label} variant="primary" size="sm" />
            <Text style={[styles.offlineText, { color: theme.textMuted }]}>Offline Ready</Text>
          </View>

          {/* High Contrast QR Code with Quiet-Zone */}
          <View style={styles.qrWrapper}>
            <View style={styles.qrBackground}>
              <QRCode
                value={data || 'https://qrsmart.app'}
                size={220}
                color="#0F172A"
                backgroundColor="#FFFFFF"
                getRef={(ref) => (qrRef.current = ref)}
              />
            </View>
          </View>

          {/* Title and Raw Data */}
          <Text style={[styles.qrTitle, { color: theme.text }]} numberOfLines={1}>
            {saveTitle}
          </Text>

          <View style={[styles.monoBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.borderLight }]}>
            <Text style={[styles.monoText, { color: theme.textSecondary }]} numberOfLines={3} selectable>
              {data}
            </Text>
          </View>
        </View>

        {/* Primary Actions */}
        <PrimaryButton
          title={isSaved ? 'Saved in Collection' : 'Save to My QR Codes'}
          icon={isSaved ? 'checkmark-circle' : 'bookmark'}
          variant={isSaved ? 'emerald' : 'emerald'}
          onPress={handleSave}
          style={styles.actionBtn}
        />

        <View style={styles.secondaryGrid}>
          <SecondaryButton
            title="Share Code"
            icon="share-social-outline"
            variant="outline"
            onPress={handleShare}
            style={styles.gridBtn}
          />
          <SecondaryButton
            title="Copy Data"
            icon="copy-outline"
            variant="outline"
            onPress={handleCopy}
            style={styles.gridBtn}
          />
        </View>

        <SecondaryButton
          title="Test Scan This QR"
          icon="scan-outline"
          variant="tinted"
          color="secondary"
          onPress={handleTestScan}
          style={{ marginTop: spacing.md }}
        />

        <SecondaryButton
          title="Generate Another QR"
          icon="add-circle-outline"
          variant="ghost"
          onPress={() => navigation.navigate('GeneratorSelect')}
          style={{ marginTop: spacing.sm }}
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
              Enter a recognizable name to store this QR code in your Saved tab.
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
              placeholder="e.g. My Website QR"
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
                title="Save"
                onPress={confirmSave}
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
  qrCard: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  offlineText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  qrWrapper: {
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.lg,
  },
  qrBackground: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  monoBox: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  monoText: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  actionBtn: {
    marginBottom: spacing.md,
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gridBtn: {
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
