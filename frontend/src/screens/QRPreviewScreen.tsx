import React, { useState, useRef } from 'react';
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
import { palette } from '../theme/colors';
import { QR_TYPES } from '../constants/config';
import { typography, borderRadius, spacing } from '../theme/typography';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { Badge } from '../components/Badge';
import { CustomQRCode } from '../components/CustomQRCode';
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

  const {
    type,
    data,
    title,
    isSaved: initialIsSaved,
    savedId,
    customization,
    fileMeta,
    isVerified,
  } = route.params;

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
      fileName: fileMeta?.filename,
      url: data,
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
      Alert.alert('Copied', 'QR data URL copied to clipboard.');
    }
  };

  const handleTestScan = () => {
    triggerLightHaptic();
    navigation.navigate('ScanResult', {
      data,
      type,
    });
  };

  const handleOpenFileUrl = async () => {
    triggerLightHaptic();
    await ActionHandler.openUrl(data);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title="Generated QR"
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
        {/* Verification Status Banner */}
        <View
          style={[
            styles.verifiedBanner,
            {
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : palette.emerald[50],
              borderColor: palette.emerald[500],
            },
          ]}
        >
          <Ionicons name="shield-checkmark" size={18} color={palette.emerald[500]} style={{ marginRight: 8 }} />
          <Text style={[styles.verifiedTitle, { color: palette.emerald[600] }]}>
            QR Verified & Scannable
          </Text>
        </View>

        {/* Clean, Premium QR Code Container Card */}
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
          {/* Top Row: Type Badge */}
          <View style={styles.cardHeader}>
            <Badge
              label={
                fileMeta?.file_type === 'photo'
                  ? 'PHOTO QR'
                  : fileMeta?.file_type === 'file' || fileMeta?.filename?.toLowerCase().endsWith('.pdf')
                  ? 'PDF QR'
                  : meta.label.toUpperCase()
              }
              variant="primary"
              size="sm"
            />
            <View style={styles.cardHeaderRight}>
              <Ionicons name="sparkles" size={14} color={palette.emerald[500]} style={{ marginRight: 4 }} />
              <Text style={[styles.cardHeaderStatus, { color: palette.emerald[600] }]}>Ready</Text>
            </View>
          </View>

          {/* High Contrast QR Code with Quiet-Zone & Custom Styling */}
          <View style={styles.qrWrapper}>
            <CustomQRCode
              value={data || 'https://qrsmart.app'}
              size={220}
              customization={customization}
              getRef={(ref) => (qrRef.current = ref)}
            />
          </View>

          {/* Clean Title & Formatted Metadata (No Raw Technical URL text) */}
          <View style={styles.cardMetaSection}>
            <Text style={[styles.qrTitle, { color: theme.text }]} numberOfLines={1}>
              {fileMeta?.filename || saveTitle}
            </Text>

            {fileMeta ? (
              <View style={styles.metaChipsRow}>
                <View style={[styles.metaPill, { backgroundColor: theme.surfaceVariant }]}>
                  <Ionicons
                    name={
                      fileMeta.file_category === 'image' || fileMeta.file_type === 'photo'
                        ? 'image-outline'
                        : 'document-text-outline'
                    }
                    size={13}
                    color={theme.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.metaPillText, { color: theme.textSecondary }]}>
                    {fileMeta.size_formatted} • {fileMeta.file_type_label || (fileMeta.file_type === 'photo' ? 'Image File' : 'PDF Document')}
                  </Text>
                </View>

                <Pressable
                  onPress={handleOpenFileUrl}
                  style={({ pressed }) => [
                    styles.openFilePill,
                    {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : palette.emerald[50],
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons name="open-outline" size={13} color={palette.emerald[600]} style={{ marginRight: 4 }} />
                  <Text style={[styles.openFilePillText, { color: palette.emerald[600] }]}>Open File</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.qrSubText, { color: theme.textSecondary }]} numberOfLines={1}>
                {type === 'url' ? data.replace(/^https?:\/\//i, '') : meta.label}
              </Text>
            )}
          </View>
        </View>

        {/* Primary Action Button: Save to My QR Codes */}
        <PrimaryButton
          title={isSaved ? 'Saved in Collection' : 'Save to My QR Codes'}
          icon={isSaved ? 'checkmark-circle' : 'bookmark'}
          variant="emerald"
          onPress={handleSave}
          style={styles.primaryActionBtn}
        />

        {/* Secondary Action Grid: Share & Copy */}
        <View style={styles.secondaryGrid}>
          <SecondaryButton
            title="Share Code"
            icon="share-social-outline"
            variant="outline"
            onPress={handleShare}
            style={styles.gridBtn}
          />
          <SecondaryButton
            title="Copy Link"
            icon="copy-outline"
            variant="outline"
            onPress={handleCopy}
            style={styles.gridBtn}
          />
        </View>

        {/* Tertiary Actions */}
        <SecondaryButton
          title="Test Scan This QR"
          icon="scan-outline"
          variant="tinted"
          color="secondary"
          onPress={handleTestScan}
          style={styles.testScanBtn}
        />

        <SecondaryButton
          title="Generate Another QR"
          icon="add-circle-outline"
          variant="ghost"
          onPress={() => navigation.navigate('GeneratorSelect')}
          style={styles.anotherBtn}
        />
      </ScrollView>

      {/* Save Modal */}
      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Save QR Code</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Enter a name to easily find this QR code in your saved collection.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
              ]}
              value={saveTitle}
              onChangeText={setSaveTitle}
              placeholder="e.g. My Photo QR"
              placeholderTextColor={theme.textMuted}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalActionRow}>
              <SecondaryButton
                title="Cancel"
                variant="ghost"
                onPress={() => setSaveModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Confirm Save"
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
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  verifiedTitle: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: typography.fontWeight.bold,
  },
  qrCard: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.base,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardMetaSection: {
    width: '100%',
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
    textAlign: 'center',
  },
  qrSubText: {
    fontSize: 12,
    textAlign: 'center',
  },
  metaChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  openFilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
  },
  openFilePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryActionBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gridBtn: {
    flex: 1,
  },
  testScanBtn: {
    marginTop: spacing.md,
  },
  anotherBtn: {
    marginTop: spacing.xs,
  },
  modalOverlay: {
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
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.lg,
  },
  modalActionRow: {
    flexDirection: 'row',
  },
});
