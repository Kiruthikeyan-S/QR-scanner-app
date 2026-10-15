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
      message: `"${saveTitle.trim()}" was saved to your collection.`,
      type: 'saved',
      data: { savedId: saved.id, name: saveTitle.trim(), qrType: type, data },
    });

    setSaveModalVisible(false);
    setIsSaved(true);
    triggerFeedback();
    Alert.alert('Saved', 'QR code saved to your collection.');
  };

  const handleShare = async () => {
    triggerLightHaptic();
    await ActionHandler.shareText(saveTitle, data);
  };

  const handleCopy = async () => {
    triggerLightHaptic();
    const ok = await ActionHandler.copyToClipboard(data);
    if (ok) {
      Alert.alert('Copied', 'Content copied to clipboard.');
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

  // Helper to format clean display text
  const getDisplayContent = () => {
    if (fileMeta) {
      return {
        title: fileMeta.filename,
        subtitle: `${fileMeta.size_formatted} • ${fileMeta.file_type_label || (fileMeta.file_type === 'photo' ? 'Photo' : 'Document')}`,
        hasFileLink: true,
      };
    }

    if (type === 'phone') {
      const cleanPhone = data.replace(/^tel:/i, '').trim();
      return {
        title: cleanPhone,
        subtitle: undefined,
        hasFileLink: false,
      };
    }

    if (type === 'url') {
      const displayUrl = data.replace(/^https?:\/\//i, '').replace(/\/$/, '');
      return {
        title: displayUrl,
        subtitle: undefined,
        hasFileLink: false,
      };
    }

    return {
      title: saveTitle || data,
      subtitle: undefined,
      hasFileLink: false,
    };
  };

  const contentInfo = getDisplayContent();

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
        {/* Clean, Minimal QR Code Container Card */}
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
          {/* Large Clean QR Code */}
          <View style={styles.qrWrapper}>
            <CustomQRCode
              value={data || 'https://qrsmart.app'}
              size={220}
              customization={customization}
              getRef={(ref) => (qrRef.current = ref)}
            />
          </View>

          {/* Simple Content Text */}
          <Text style={[styles.contentTitle, { color: theme.text }]} numberOfLines={2}>
            {contentInfo.title}
          </Text>

          {contentInfo.subtitle && (
            <Text style={[styles.contentSubtitle, { color: theme.textSecondary }]}>
              {contentInfo.subtitle}
            </Text>
          )}

          {fileMeta && (
            <View style={styles.expiryRow}>
              <Ionicons name="time-outline" size={13} color={theme.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.expiryText, { color: theme.textMuted }]}>
                {fileMeta.expires_at
                  ? `Expires in 7 days (${new Date(fileMeta.expires_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })})`
                  : 'Expires in 7 days'}
              </Text>
            </View>
          )}

          {contentInfo.hasFileLink && (
            <Pressable
              onPress={handleOpenFileUrl}
              style={({ pressed }) => [
                styles.openFileBtn,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : palette.emerald[50],
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="open-outline" size={13} color={palette.emerald[600]} style={{ marginRight: 4 }} />
              <Text style={[styles.openFileBtnText, { color: palette.emerald[600] }]}>Open File</Text>
            </Pressable>
          )}
        </View>

        {/* Primary Action: Save to My QR Codes */}
        <PrimaryButton
          title={isSaved ? 'Saved in Collection' : 'Save to My QR Codes'}
          icon={isSaved ? 'checkmark-circle' : 'bookmark'}
          variant="emerald"
          onPress={handleSave}
          style={styles.primaryActionBtn}
        />

        {/* Secondary Action Grid */}
        <View style={styles.secondaryGrid}>
          <SecondaryButton
            title="Share Code"
            icon="share-social-outline"
            variant="outline"
            onPress={handleShare}
            style={styles.gridBtn}
          />
          <SecondaryButton
            title={type === 'url' || fileMeta ? 'Copy Link' : 'Copy'}
            icon="copy-outline"
            variant="outline"
            onPress={handleCopy}
            style={styles.gridBtn}
          />
        </View>

        {/* Tertiary Actions */}
        <SecondaryButton
          title="Test Scan"
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
              Enter a name for this QR code in your saved collection.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
              ]}
              value={saveTitle}
              onChangeText={setSaveTitle}
              placeholder="e.g. My QR Code"
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
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.base,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
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
  contentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: 2,
  },
  contentSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  openFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    marginTop: 4,
  },
  openFileBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  expiryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
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
