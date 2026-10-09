import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius, spacing } from '../theme/typography';
import { SettingRow } from '../components/SettingRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { SettingsStorage } from '../storage/settingsStorage';
import { HistoryStorage } from '../storage/historyStorage';
import { SavedQRStorage } from '../storage/savedQRStorage';
import { UserSettings, defaultSettings } from '../types/settings';
import { APP_INFO } from '../constants/config';
import { triggerFeedback, triggerLightHaptic } from '../utils/feedback';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { theme, isDark, setThemeMode } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  useEffect(() => {
    SettingsStorage.get().then((loaded) => {
      setSettings(loaded);
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
      'Clear Scan History?',
      'This will permanently remove your local scan history records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
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
      'Clear Saved Collection?',
      'This will permanently remove all saved QR codes from your local collection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Collection',
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

  const handleCameraPermissionPress = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted && Platform.OS !== 'web') {
        Alert.alert(
          'Camera Permission',
          'Camera access is required to scan QR codes and barcodes.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } else {
      Alert.alert('Camera Permission', 'Camera access is granted and ready for scanning.');
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
        {/* Section 1: SCANNER */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          SCANNER
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingRow
            icon="pulse-outline"
            title="Vibration"
            type="toggle"
            value={settings.vibration}
            onValueChange={(val) => updateSetting('vibration', val)}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="volume-high-outline"
            title="Sound"
            type="toggle"
            value={settings.sound}
            onValueChange={(val) => updateSetting('sound', val)}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="clipboard-outline"
            title="Auto-Copy"
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
            badgeText={permission?.granted ? 'Allowed' : 'Denied'}
            badgeColor={permission?.granted ? palette.emerald[600] : palette.rose[500]}
            badgeBgColor={
              permission?.granted
                ? isDark
                  ? 'rgba(16, 185, 129, 0.18)'
                  : palette.emerald[50]
                : isDark
                ? 'rgba(239, 68, 68, 0.18)'
                : palette.rose[50]
            }
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
            iconBgColor={isDark ? 'rgba(239, 68, 68, 0.15)' : palette.rose[50]}
            title="Clear Scan History"
            type="action"
            isDestructive
            onPress={handleClearAllHistory}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="albums-outline"
            iconColor={palette.rose[500]}
            iconBgColor={isDark ? 'rgba(239, 68, 68, 0.15)' : palette.rose[50]}
            title="Clear Saved Collection"
            type="action"
            isDestructive
            onPress={handleClearAllSaved}
          />
        </View>

        {/* Section 4: TOOLS */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          TOOLS
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingRow
            icon="wifi-outline"
            iconColor={theme.primary}
            iconBgColor={theme.primaryLight}
            title="Network Diagnostics"
            type="navigation"
            onPress={() => navigation.navigate('NetworkChecker')}
          />
        </View>

        {/* Section 5: ABOUT */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          ABOUT
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingRow
            icon="information-circle-outline"
            title="About Qrinova"
            type="navigation"
            onPress={() => setAboutModalVisible(true)}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          <SettingRow
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            type="navigation"
            onPress={() => setPrivacyModalVisible(true)}
          />
        </View>

        {/* App Version Footer */}
        <View style={styles.footerInfo}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            {APP_INFO.name} v{APP_INFO.version}
          </Text>
          <Text style={[styles.footerSubText, { color: theme.textMuted }]}>
            {APP_INFO.copyright} • All rights reserved
          </Text>
        </View>
      </ScrollView>

      {/* About Modal */}
      <Modal
        visible={aboutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>About Qrinova</Text>
            <Text style={[styles.modalContent, { color: theme.textSecondary }]}>
              Qrinova is a privacy-first, high-performance QR code and barcode toolkit.
              {'\n\n'}
              Key Features:
              {'\n'}• High-speed camera scanner & gallery image decoding
              {'\n'}• Built-in URL Safety & Phishing Protection
              {'\n'}• Multi-format QR generator (Wi-Fi, Contact, Photo, PDF, Order ID, JSON, and more)
              {'\n'}• Offline history & saved collection management
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
              Your privacy is protected.
              {'\n\n'}
              • QR codes and credentials are processed locally on your device.
              {'\n'}• No personal data is collected or tracked without your action.
              {'\n'}• Camera access is used solely for real-time QR code scanning.
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
  sectionHeading: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: spacing.xs,
    marginTop: spacing.sm,
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
  modalContent: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.base,
  },
});
