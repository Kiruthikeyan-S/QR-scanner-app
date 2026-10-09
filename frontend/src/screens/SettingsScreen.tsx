import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius, spacing } from '../theme/typography';
import { SettingRow } from '../components/SettingRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { SettingsStorage } from '../storage/settingsStorage';
import { HistoryStorage } from '../storage/historyStorage';
import { SavedQRStorage } from '../storage/savedQRStorage';
import { UserSettings, defaultSettings } from '../types/settings';
import { APP_INFO } from '../constants/config';
import { triggerFeedback, triggerLightHaptic } from '../utils/feedback';

import { getBaseApiUrl, getAutoDetectedHost } from '../api/client';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [activeBackendUrl, setActiveBackendUrl] = useState<string>('http://localhost:8000');
  const [apiUrlModalVisible, setApiUrlModalVisible] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState('');
  const [supabaseModalVisible, setSupabaseModalVisible] = useState(false);
  const [tempSupabaseUrl, setTempSupabaseUrl] = useState('');
  const [tempSupabaseKey, setTempSupabaseKey] = useState('');
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  useEffect(() => {
    SettingsStorage.get().then(async (loaded) => {
      setSettings(loaded);
      const activeUrl = await getBaseApiUrl();
      setActiveBackendUrl(activeUrl);
      setTempApiUrl(loaded.backendUrl || activeUrl);
      setTempSupabaseUrl(
        loaded.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || ''
      );
      setTempSupabaseKey(
        loaded.supabaseKey ||
          process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
          ''
      );
    });
  }, []);

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const updated = await SettingsStorage.save({ [key]: value });
    setSettings(updated);
  };

  const handleToggleDarkMode = (val: boolean) => {
    setThemeMode(val ? 'dark' : 'light');
    updateSetting('themeMode', val ? 'dark' : 'light');
  };

  const handleClearAllHistory = () => {
    Alert.alert(
      'Clear Scan History',
      'Are you sure you want to permanently erase all scanned QR history records?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await HistoryStorage.clearAll();
            triggerFeedback();
            Alert.alert('History Cleared', 'All scan history records have been removed.');
          },
        },
      ]
    );
  };

  const handleClearAllSaved = () => {
    Alert.alert(
      'Clear Saved QRs',
      'Are you sure you want to remove all saved QR codes from your collection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await SavedQRStorage.clearAll();
            triggerFeedback();
            Alert.alert('Saved QRs Cleared', 'All saved items have been removed.');
          },
        },
      ]
    );
  };

  const handleSaveApiUrl = async () => {
    let clean = tempApiUrl.trim();
    if (!clean) {
      clean = getAutoDetectedHost();
    }
    await updateSetting('backendUrl', clean);
    setActiveBackendUrl(clean);
    setApiUrlModalVisible(false);
    triggerFeedback();
    Alert.alert('Backend URL Saved', `FastAPI backend URL set to:\n${clean}`);
  };

  const handleCameraPermissionPress = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted && Platform.OS !== 'web') {
        Alert.alert(
          'Camera Access',
          'Please enable camera permissions in your device system settings to scan QR codes.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } else {
      Alert.alert('Permission Granted', 'Camera access is active and ready for scanning.');
    }
  };

  const handleSaveSupabaseConfig = async () => {
    let cleanUrl = tempSupabaseUrl.trim();
    const cleanKey = tempSupabaseKey.trim();

    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    await updateSetting('supabaseUrl', cleanUrl);
    await updateSetting('supabaseKey', cleanKey);
    setSupabaseModalVisible(false);
    triggerFeedback();
    Alert.alert('Configuration Saved', 'Supabase Cloud Storage credentials updated.');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile / Status Banner */}
        <View
          style={[
            styles.bannerCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.cardShadow,
            },
          ]}
        >
          <View style={styles.bannerTop}>
            <View style={[styles.bannerIconBox, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: theme.text }]}>QR Smart</Text>
              <Text style={[styles.bannerSubtitle, { color: theme.textSecondary }]}>
                Fast & Secure QR Toolkit
              </Text>
            </View>
          </View>
        </View>

        {/* Section 1: SCAN PREFERENCES */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          SCAN PREFERENCES
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingRow
            icon="pulse-outline"
            title="Vibration Feedback"
            type="toggle"
            value={settings.vibration}
            onValueChange={(val) => updateSetting('vibration', val)}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="volume-high-outline"
            title="Sound Feedback"
            type="toggle"
            value={settings.sound}
            onValueChange={(val) => updateSetting('sound', val)}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="clipboard-outline"
            title="Auto-Copy Scanned Data"
            type="toggle"
            value={settings.autoCopy}
            onValueChange={(val) => updateSetting('autoCopy', val)}
          />
        </View>

        {/* Section 2: APPEARANCE & PERMISSIONS */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          APPEARANCE & PERMISSIONS
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingRow
            icon={isDark ? 'moon' : 'sunny-outline'}
            iconColor={isDark ? palette.indigo[400] : palette.amber[500]}
            iconBgColor={isDark ? 'rgba(99, 102, 241, 0.15)' : palette.amber[50]}
            title="Dark Mode"
            type="toggle"
            value={isDark}
            onValueChange={handleToggleDarkMode}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="camera-outline"
            title="Camera Permission"
            type="badge"
            badgeText={permission?.granted ? 'GRANTED' : 'DENIED'}
            onPress={handleCameraPermissionPress}
          />
        </View>

        {/* Section 3: DATA & STORAGE */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          DATA & STORAGE
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingRow
            icon="trash-outline"
            iconColor={palette.rose[500]}
            iconBgColor={palette.rose[50]}
            title="Clear Scan History"
            type="action"
            isDestructive
            onPress={handleClearAllHistory}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="albums-outline"
            iconColor={palette.amber[600]}
            iconBgColor={palette.amber[50]}
            title="Clear Saved Collection"
            type="action"
            isDestructive
            onPress={handleClearAllSaved}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="cloud-upload-outline"
            iconColor={palette.emerald[500]}
            iconBgColor={isDark ? 'rgba(16, 185, 129, 0.15)' : palette.emerald[50]}
            title="Cloud Storage (Supabase)"
            type="navigation"
            onPress={() => setSupabaseModalVisible(true)}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="wifi-outline"
            iconColor={theme.primary}
            iconBgColor={theme.primaryLight}
            title="Network Diagnostics"
            type="navigation"
            onPress={() => navigation.navigate('NetworkChecker')}
          />
        </View>

        {/* Section 4: ABOUT & LEGAL */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          ABOUT & LEGAL
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingRow
            icon="information-circle-outline"
            title="About QR Smart"
            type="navigation"
            onPress={() => setAboutModalVisible(true)}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="shield-outline"
            title="Privacy Policy"
            type="navigation"
            onPress={() => setPrivacyModalVisible(true)}
          />
        </View>

        {/* App Version Footer */}
        <View style={styles.footerInfo}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            {APP_INFO.name} • v{APP_INFO.version} (Build {APP_INFO.build})
          </Text>
          <Text style={[styles.footerSubText, { color: theme.textMuted }]}>
            {APP_INFO.copyright} • All rights reserved
          </Text>
        </View>
      </ScrollView>

      {/* Backend URL Modal */}
      <Modal
        visible={apiUrlModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setApiUrlModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Configure Backend API</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Enter the IP/URL of your Python FastAPI backend server:
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
              value={tempApiUrl}
              onChangeText={setTempApiUrl}
              placeholder="http://192.168.1.50:8000"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              onPress={() => {
                triggerLightHaptic();
                setTempApiUrl(getAutoDetectedHost());
              }}
              style={{ marginVertical: spacing.xs, alignSelf: 'flex-start' }}
            >
              <Text style={{ fontSize: typography.fontSize.xs, color: theme.primary, fontWeight: '600' }}>
                Auto-fill detected IP ({getAutoDetectedHost()})
              </Text>
            </Pressable>

            <Text style={[styles.ipHint, { color: theme.textMuted }]}>
              Tip: When testing on a physical mobile device, use your computer's local Wi-Fi IP address instead of localhost.
            </Text>

            <View style={styles.modalButtons}>
              <SecondaryButton
                title="Cancel"
                variant="ghost"
                onPress={() => setApiUrlModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Save URL"
                onPress={handleSaveApiUrl}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Supabase Storage Modal */}
      <Modal
        visible={supabaseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSupabaseModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Supabase Cloud Storage</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Enter your Supabase Project URL and Publishable Key for direct Photo & PDF QR uploads.
            </Text>

            <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.md }]}>
              Project URL
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
              value={tempSupabaseUrl}
              onChangeText={setTempSupabaseUrl}
              placeholder="https://your-project.supabase.co"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.inputLabel, { color: theme.text, marginTop: spacing.md }]}>
              Publishable Key
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
              value={tempSupabaseKey}
              onChangeText={setTempSupabaseKey}
              placeholder="sb_publishable_..."
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.ipHint, { color: theme.textMuted }]}>
              Bucket: qr-files (Public). Direct upload from your mobile device without relying on localhost.
            </Text>

            <View style={styles.modalButtons}>
              <SecondaryButton
                title="Cancel"
                variant="ghost"
                onPress={() => setSupabaseModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Save"
                onPress={handleSaveSupabaseConfig}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={aboutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>About QR Smart</Text>
            <Text style={[styles.modalContent, { color: theme.textSecondary }]}>
              QR Smart is an all-in-one, privacy-focused QR and barcode toolkit designed for speed, security, and simplicity.
              {'\n\n'}
              Features:
              {'\n'}• High-speed scanner for QR codes and barcodes
              {'\n'}• Built-in URL Safety & Phishing Protection
              {'\n'}• Multi-format QR creation (Wi-Fi, Contact, Photo, PDF, Order ID, JSON, and more)
              {'\n'}• Offline-first history and collection management
              {'\n'}• High-resolution PNG and PDF export
            </Text>

            <PrimaryButton
              title="Close"
              onPress={() => setAboutModalVisible(false)}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={privacyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Privacy Policy</Text>
            <Text style={[styles.modalContent, { color: theme.textSecondary }]}>
              Your privacy is completely protected.
              {'\n\n'}
              • All QR codes and Wi-Fi credentials are processed locally on your device.
              {'\n'}• No personal data is sent to external servers without your explicit action.
              {'\n'}• Camera access is used strictly for decoding QR codes in real-time.
            </Text>

            <PrimaryButton
              title="I Understand"
              onPress={() => setPrivacyModalVisible(false)}
              style={{ marginTop: spacing.lg }}
            />
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  bannerCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bannerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  bannerSubtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  sectionHeading: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: 4,
    marginLeft: spacing.xs,
    marginTop: spacing.xs,
  },
  cardGroup: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    marginLeft: 54,
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  footerSubText: {
    fontSize: 10,
    marginTop: 2,
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
    marginBottom: spacing.md,
  },
  modalContent: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.base,
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xs,
  },
  ipHint: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
