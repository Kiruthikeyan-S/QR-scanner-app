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
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  useEffect(() => {
    SettingsStorage.get().then(async (loaded) => {
      setSettings(loaded);
      const activeUrl = await getBaseApiUrl();
      setActiveBackendUrl(activeUrl);
      setTempApiUrl(loaded.backendUrl || activeUrl);
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
                Optical Clarity Design Language • Safe & Local
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
            subtitle="Vibrate device when QR is decoded"
            type="toggle"
            value={settings.vibration}
            onValueChange={(val) => updateSetting('vibration', val)}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="volume-high-outline"
            title="Sound Feedback"
            subtitle="Play sound tone on scan success"
            type="toggle"
            value={settings.sound}
            onValueChange={(val) => updateSetting('sound', val)}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="clipboard-outline"
            title="Auto-Copy Scanned Data"
            subtitle="Copy decoded text to clipboard immediately"
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
            subtitle="Toggle Optical Clarity high-contrast dark theme"
            type="toggle"
            value={isDark}
            onValueChange={handleToggleDarkMode}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="camera-outline"
            title="Camera Permission"
            subtitle={permission?.granted ? 'Access Granted' : 'Requires permission to scan'}
            type="badge"
            badgeText={permission?.granted ? 'GRANTED' : 'DENIED'}
            onPress={handleCameraPermissionPress}
          />
        </View>

        {/* Section 3: DATA & STORAGE */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          DATA & BACKEND
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingRow
            icon="server-outline"
            iconColor={palette.cyan[600]}
            iconBgColor={palette.cyan[50]}
            title="FastAPI Backend URL"
            subtitle={activeBackendUrl}
            type="navigation"
            onPress={() => setApiUrlModalVisible(true)}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="wifi-outline"
            iconColor={theme.primary}
            iconBgColor={theme.primaryLight}
            title="Network Checker"
            subtitle="Test network connection and offline diagnostics"
            type="navigation"
            onPress={() => navigation.navigate('NetworkChecker')}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="trash-outline"
            title="Clear Scan History"
            subtitle="Remove all saved scan history items"
            type="action"
            isDestructive
            onPress={handleClearAllHistory}
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
            {APP_INFO.name} • Version {APP_INFO.version} (Build {APP_INFO.build})
          </Text>
          <Text style={[styles.footerSubText, { color: theme.textMuted }]}>
            {APP_INFO.designSystem} • {APP_INFO.copyright}
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
              QR Smart is a high-speed, secure QR scanner and generator built with React Native, Expo, and FastAPI.
              {'\n\n'}
              Features:
              {'\n'}• 100% Offline-first scanning & generation
              {'\n'}• Optical Clarity Design Language
              {'\n'}• Support for URL, Wi-Fi, vCard, Email, SMS, Phone & Location
              {'\n'}• Safe URL previewing before opening
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
    padding: spacing.base,
    marginBottom: spacing.xl,
    elevation: 2,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bannerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: typography.fontSize.xs,
  },
  sectionHeading: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
    marginTop: spacing.sm,
  },
  cardGroup: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.lg,
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
