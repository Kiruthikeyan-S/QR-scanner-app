import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { ImageScanService, DecodedCode } from '../services/imageScanService';
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
import { checkURLSafety } from '../utils/urlSafety';
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
  const [foundCodes, setFoundCodes] = useState<DecodedCode[] | null>(null);

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

  const processScannedData = async (rawData: string, isBarcode = false) => {
    const detectedType = detectQRType(rawData);
    // Barcodes (EAN/Code128/...) keep the 'barcode' type unless they hold a URL,
    // in which case the same URL-safety flow as the live scanner applies.
    const qrType = isBarcode && detectedType !== 'url' ? 'barcode' : detectedType;
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

    if (qrType === 'url') {
      // Run security reputation & heuristic check
      const safetyResult = await checkURLSafety(rawData);

      if (safetyResult.status === 'safe') {
        // Only SAFE URLs are saved to History
        const savedRecord = await HistoryStorage.add({
          type: 'url',
          data: rawData,
          safetyStatus: 'safe',
        });

        await NotificationStorage.add({
          title: 'Safe Link Scanned',
          message: `Scanned verified link: ${safetyResult.domain}`,
          type: 'scan',
          data: { scanId: savedRecord.id, qrType: 'url', data: rawData },
        });

        navigation.replace('ScanResult', {
          data: rawData,
          type: 'url',
          scannedAt: savedRecord.scanned_at,
          fromHistoryId: savedRecord.id,
          safetyResult,
        });
      } else {
        // UNSAFE, SUSPICIOUS, UNKNOWN URLs are NEVER saved to History or Last Scanned
        if (safetyResult.status === 'unsafe') {
          await NotificationStorage.add({
            title: 'Security Alert: Unsafe Link Blocked',
            message: `Warning: Blocked potential threat from ${safetyResult.domain}`,
            type: 'alert',
            data: { qrType: 'url', data: rawData },
          });
        }

        navigation.replace('ScanResult', {
          data: rawData,
          type: 'url',
          scannedAt: new Date().toISOString(),
          safetyResult,
        });
      }
    } else {
      // Non-URL QR types (Text, Wi-Fi, Contact, Barcode, etc.) save normally
      const savedRecord = await HistoryStorage.add({
        type: qrType,
        data: rawData,
      });

      await NotificationStorage.add({
        title: 'QR Code Scanned',
        message: `Scanned ${qrType.toUpperCase()} content: ${rawData.substring(0, 50)}${rawData.length > 50 ? '...' : ''}`,
        type: 'scan',
        data: { scanId: savedRecord.id, qrType, data: rawData },
      });

      navigation.replace('ScanResult', {
        data: rawData,
        type: qrType,
        scannedAt: savedRecord.scanned_at,
        fromHistoryId: savedRecord.id,
      });
    }
  };

  const unlockScanner = () => {
    isLockedRef.current = false;
    setIsScanningLocked(false);
  };

  const openCodeResult = async (code: DecodedCode) => {
    setFoundCodes(null);
    isLockedRef.current = true;
    setIsScanningLocked(true);
    // Same result / history / URL-safety flow as the live camera scanner
    await processScannedData(code.data, !code.isQR);
  };

  const showNoCodeFound = () => {
    Alert.alert('No code found', 'No QR code or barcode was found in this image.', [
      { text: 'Choose Another Image', onPress: () => handlePickImage() },
      { text: 'Scan with Camera', style: 'cancel' },
    ]);
  };

  const handlePickImage = async () => {
    if (isProcessingImage) return;
    try {
      triggerLightHaptic();
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      // Pause live camera decoding while the image is analysed locally
      isLockedRef.current = true;
      setIsScanningLocked(true);
      setIsProcessingImage(true);

      let codes: DecodedCode[] = [];
      try {
        codes = await ImageScanService.decodeImage(res.assets[0].uri);
      } catch {
        codes = [];
      }
      setIsProcessingImage(false);

      if (codes.length === 0) {
        // Failed scans are never added to History
        unlockScanner();
        showNoCodeFound();
      } else if (codes.length === 1) {
        await openCodeResult(codes[0]);
      } else {
        setFoundCodes(codes);
      }
    } catch {
      setIsProcessingImage(false);
      unlockScanner();
      Alert.alert('Could not open image', 'Please try again or choose a different image.');
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
          Qrinova needs camera access to scan and decode QR codes in real-time.
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

      {/* Multiple Codes Found Modal */}
      <Modal
        visible={!!foundCodes && foundCodes.length > 1}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setFoundCodes(null);
          unlockScanner();
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.multiCodeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.multiCodeTitle, { color: theme.text }]}>
              {foundCodes?.length || 0} Codes Found
            </Text>
            <Text style={[styles.multiCodeSubtitle, { color: theme.textSecondary }]}>
              Select a code to inspect and take action:
            </Text>

            <View style={styles.codeList}>
              {foundCodes?.map((item, idx) => (
                <Pressable
                  key={`${item.format}-${idx}-${item.data.slice(0, 16)}`}
                  style={({ pressed }) => [
                    styles.codeItemRow,
                    {
                      backgroundColor: pressed ? theme.surfaceHighlight : theme.surfaceVariant,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => openCodeResult(item)}
                >
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeBadgeText}>{item.label}</Text>
                  </View>
                  <Text style={[styles.codeItemData, { color: theme.text }]} numberOfLines={2}>
                    {item.data}
                  </Text>
                </Pressable>
              ))}
            </View>

            <SecondaryButton
              title="Cancel"
              variant="outline"
              onPress={() => {
                setFoundCodes(null);
                unlockScanner();
              }}
              style={{ marginTop: spacing.md }}
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  multiCodeCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    elevation: 8,
  },
  multiCodeTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  multiCodeSubtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  codeList: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  codeItemRow: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  codeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
  },
  codeBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  codeItemData: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono,
  },
});
