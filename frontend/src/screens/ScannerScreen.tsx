import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { ScannerOverlay } from '../components/ScannerOverlay';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { useTheme } from '../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../theme/typography';
import { detectQRType } from '../utils/qrParser';
import { HistoryStorage } from '../storage/historyStorage';
import { SettingsStorage } from '../storage/settingsStorage';
import { NotificationStorage } from '../storage/notificationStorage';
import { triggerFeedback, triggerLightHaptic } from '../utils/feedback';
import { ActionHandler } from '../utils/actionHandler';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ScannerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanningLocked, setIsScanningLocked] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const isLockedRef = useRef(false);

  useEffect(() => {
    isLockedRef.current = isScanningLocked;
  }, [isScanningLocked]);

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (isLockedRef.current) return;
    const rawData = result.data;
    if (!rawData) return;

    // Lock scanning immediately to avoid duplicate events
    isLockedRef.current = true;
    setIsScanningLocked(true);

    await processScannedData(rawData);
  };

  const processScannedData = async (rawData: string) => {
    const qrType = detectQRType(rawData);
    const settings = await SettingsStorage.get();

    // Trigger vibration & audio feedback
    await triggerFeedback({
      vibration: settings.vibration,
      sound: settings.sound,
    });

    // Auto copy if enabled in settings
    if (settings.autoCopy) {
      await ActionHandler.copyToClipboard(rawData);
    }

    // Save locally to history
    const savedRecord = await HistoryStorage.add({
      type: qrType,
      data: rawData,
    });

    // Record in-app notification
    await NotificationStorage.add({
      title: 'QR Code Scanned',
      message: `Scanned ${qrType.toUpperCase()} content: ${rawData.substring(0, 50)}${rawData.length > 50 ? '...' : ''}`,
      type: 'scan',
      data: { scanId: savedRecord.id, qrType, data: rawData },
    });

    // Navigate to Scan Result Screen
    navigation.replace('ScanResult', {
      data: rawData,
      type: qrType,
      scannedAt: savedRecord.scanned_at,
      fromHistoryId: savedRecord.id,
    });
  };

  const handlePickImage = async () => {
    try {
      triggerLightHaptic();
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setIsProcessingImage(true);
        const imageUri = res.assets[0].uri;
        
        // Image selected: In Expo, if barcode scanning on static images is available
        // or user can test custom text QR directly.
        // Prompt for convenience or process directly
        Alert.prompt
          ? Alert.prompt(
              'Decode Image QR',
              'Enter QR data or simulated read from selected image:',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => setIsProcessingImage(false) },
                {
                  text: 'Process',
                  onPress: (text?: string) => {
                    setIsProcessingImage(false);
                    if (text && text.trim()) {
                      processScannedData(text.trim());
                    }
                  },
                },
              ],
              'plain-text',
              'https://example.com/from-gallery'
            )
          : (() => {
              setIsProcessingImage(false);
              Alert.alert(
                'Image Selected',
                'Successfully selected image from gallery.',
                [
                  {
                    text: 'Process Sample URL',
                    onPress: () => processScannedData('https://example.com/from-gallery'),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            })();
      }
    } catch (e: any) {
      setIsProcessingImage(false);
      Alert.alert('Error', e.message || 'Failed to select image');
    }
  };

  const handleSimulateScan = () => {
    // Helpful simulation for simulators / web testing
    const sampleQRs = [
      'https://github.com/expo/expo',
      'WIFI:T:WPA;S:Office_HighSpeed_5G;P:SecurePass2026;H:false;;',
      'tel:+14155552671',
      'mailto:support@qrsmart.app?subject=Inquiry&body=Hello team',
      'BEGIN:VCARD\nVERSION:3.0\nFN:Sarah Connor\nORG:Tech Corp\nTEL;TYPE=CELL:+15550199283\nEMAIL:sarah@example.com\nEND:VCARD',
      'geo:37.7749,-122.4194?q=San+Francisco',
    ];
    const randomQR = sampleQRs[Math.floor(Math.random() * sampleQRs.length)];
    processScannedData(randomQR);
  };

  if (!permission) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: '#000000' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.statusText, { color: '#FFFFFF' }]}>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
          <Text style={{ fontSize: 32 }}>📷</Text>
        </View>

        <Text style={[styles.permTitle, { color: theme.text }]}>Camera Permission Required</Text>
        <Text style={[styles.permSubtitle, { color: theme.textSecondary }]}>
          QR Smart needs camera access to scan and decode QR codes in real-time.
        </Text>

        <PrimaryButton
          title="Grant Camera Access"
          onPress={requestPermission}
          style={styles.permButton}
        />

        <SecondaryButton
          title="Cancel"
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.md }}
        />

        <SecondaryButton
          title="Simulate Scan (Test Mode)"
          variant="outline"
          color="primary"
          onPress={handleSimulateScan}
          style={{ marginTop: spacing.xl }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchEnabled}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={isScanningLocked ? undefined : handleBarcodeScanned}
      />

      <ScannerOverlay
        torchEnabled={torchEnabled}
        onToggleTorch={() => setTorchEnabled(!torchEnabled)}
        onPickImage={handlePickImage}
        onClose={() => navigation.goBack()}
        isScanning={!isScanningLocked}
      />

      {isProcessingImage && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Analyzing QR code...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  statusText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  permTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  permSubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.lineHeight.sm,
    marginBottom: spacing['2xl'],
    maxWidth: 300,
  },
  permButton: {
    width: '100%',
    maxWidth: 280,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
