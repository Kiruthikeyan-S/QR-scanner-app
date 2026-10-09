import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Network from 'expo-network';
import { RootStackParamList } from '../types/navigation';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { QR_TYPES } from '../constants/config';
import { typography, borderRadius, spacing } from '../theme/typography';
import { URLPreviewCard } from '../components/URLPreviewCard';
import { QRCustomizer } from '../components/QRCustomizer';
import { CustomQRCode } from '../components/CustomQRCode';
import { QRFormatter } from '../utils/qrFormatter';
import { FileUploadService } from '../services/fileUploadService';
import { QRCustomization } from '../types/qr';
import { triggerLightHaptic, triggerFeedback } from '../utils/feedback';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FormRouteProp = RouteProp<RootStackParamList, 'GeneratorForm'>;

export const GeneratorFormScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FormRouteProp>();

  const { type } = route.params;
  const meta = QR_TYPES[type] || QR_TYPES.text;

  // Form states
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);
  const [showWifiPass, setShowWifiPass] = useState(false);

  const [phoneCode, setPhoneCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [smsPhone, setSmsPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactWebsite, setContactWebsite] = useState('');
  const [contactAddress, setContactAddress] = useState('');

  const [locLat, setLocLat] = useState('');
  const [locLng, setLocLng] = useState('');
  const [locLabel, setLocLabel] = useState('');

  // Order ID States
  const [orderId, setOrderId] = useState('');
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // JSON States
  const [jsonText, setJsonText] = useState(
    '{\n  "name": "Kiruthikeyan",\n  "id": "12345",\n  "status": "active"\n}'
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Photo & PDF States
  const [selectedPhoto, setSelectedPhoto] = useState<{
    uri: string;
    name: string;
    size: number;
    mimeType?: string;
  } | null>(null);

  const [selectedPdf, setSelectedPdf] = useState<{
    uri: string;
    name: string;
    size: number;
    mimeType?: string;
  } | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDetailText, setUploadDetailText] = useState('');

  // Single Upload Cache: stores upload results by local URI so customizations don't re-upload
  const uploadCache = useRef<Record<string, any>>({});

  // Full-size image preview modal
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // Customization State
  const [customization, setCustomization] = useState<QRCustomization>({
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    size: 220,
    errorCorrectionLevel: 'M',
  });

  // Reset state when generator type changes
  React.useEffect(() => {
    setSelectedPhoto(null);
    setSelectedPdf(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadDetailText('');
    uploadCache.current = {};
  }, [type]);

  // Photo Picker Handler
  const handlePickPhoto = async () => {
    try {
      triggerLightHaptic();
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo gallery access in your device settings to select images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = asset.fileName || `photo_${Date.now()}.jpg`;
        const size = asset.fileSize || 1024 * 500;
        const mimeType = asset.mimeType || 'image/jpeg';

        if (size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Photos must be 10 MB or smaller.');
          return;
        }

        // Reset any cached upload for fresh asset
        uploadCache.current = {};
        setSelectedPhoto({
          uri: asset.uri,
          name,
          size,
          mimeType,
        });
      }
    } catch (e: any) {
      Alert.alert('Picker Error', e.message || 'Failed to select photo.');
    }
  };

  const handleRemovePhoto = () => {
    triggerLightHaptic();
    setSelectedPhoto(null);
    uploadCache.current = {};
  };

  // PDF Document Picker Handler
  const handlePickPdf = async () => {
    try {
      triggerLightHaptic();
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/*', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const size = asset.size || 0;
        const name = asset.name || 'document.pdf';

        if (size > 25 * 1024 * 1024) {
          Alert.alert('File Too Large', 'PDF files must be 25 MB or smaller.');
          return;
        }

        // Reset any cached upload for fresh asset
        uploadCache.current = {};
        setSelectedPdf({
          uri: asset.uri,
          name,
          size,
          mimeType: asset.mimeType || 'application/pdf',
        });
      }
    } catch (e: any) {
      Alert.alert('Picker Error', e.message || 'Failed to select PDF document.');
    }
  };

  const handleRemovePdf = () => {
    triggerLightHaptic();
    setSelectedPdf(null);
    uploadCache.current = {};
  };

  // Format JSON Action Handler
  const handleFormatJson = () => {
    triggerLightHaptic();
    try {
      const parsed = JSON.parse(jsonText.trim());
      const pretty = JSON.stringify(parsed, null, 2);
      setJsonText(pretty);
      setJsonError(null);
    } catch (e: any) {
      setJsonError('Invalid JSON: ' + (e.message || 'Syntax error'));
      Alert.alert('Invalid JSON Format', 'Please enter valid JSON before formatting.');
    }
  };

  const handleClearJson = () => {
    triggerLightHaptic();
    setJsonText('');
    setJsonError(null);
  };

  // Compute Live Preview Payload
  const getPreviewPayload = (): string => {
    switch (type) {
      case 'url':
        return url.trim() ? QRFormatter.formatURL({ url }) : 'https://qrsmart.app';
      case 'text':
        return text.trim() ? QRFormatter.formatText({ text }) : 'QR Smart Text';
      case 'wifi':
        return wifiSsid.trim()
          ? QRFormatter.formatWifi({ ssid: wifiSsid, password: wifiPass, security: wifiSecurity, hidden: wifiHidden })
          : 'WIFI:S:MyNetwork;;';
      case 'phone':
        return phoneNumber.trim() ? QRFormatter.formatPhone({ countryCode: phoneCode, phoneNumber }) : 'tel:+1234567890';
      case 'email':
        return emailTo.trim() ? QRFormatter.formatEmail({ email: emailTo, subject: emailSubject, body: emailBody }) : 'mailto:hello@qrsmart.app';
      case 'sms':
        return smsPhone.trim() ? QRFormatter.formatSMS({ phoneNumber: smsPhone, message: smsMessage }) : 'smsto:+1234567890:Hi';
      case 'contact':
        return contactName.trim()
          ? QRFormatter.formatContact({
              fullName: contactName,
              phone: contactPhone,
              email: contactEmail,
              company: contactCompany,
              website: contactWebsite,
              address: contactAddress,
            })
          : 'BEGIN:VCARD...';
      case 'location':
        return locLat.trim() && locLng.trim() ? QRFormatter.formatLocation({ latitude: locLat, longitude: locLng, label: locLabel }) : 'geo:37.7749,-122.4194';
      case 'photo':
        return selectedPhoto ? `https://qrsmart.app/photo-preview` : 'https://qrsmart.app';
      case 'file':
        return selectedPdf ? `https://qrsmart.app/file-preview` : 'https://qrsmart.app';
      case 'order_id':
        return orderId.trim()
          ? QRFormatter.formatOrderId({
              orderId,
              customerName: orderCustomer,
              reference: orderReference,
              note: orderNote,
            })
          : 'ORD-2026-000123';
      case 'json': {
        try {
          const parsed = JSON.parse(jsonText.trim());
          return JSON.stringify(parsed);
        } catch {
          return jsonText.trim() || '{"status":"active"}';
        }
      }
      default:
        return 'https://qrsmart.app';
    }
  };

  // Check if file is ready (for photo and file types)
  const isFileSelected =
    type === 'photo' ? Boolean(selectedPhoto) : type === 'file' ? Boolean(selectedPdf) : true;

  const handleGenerate = async () => {
    let payload = '';
    let title = meta.label;
    let fileMeta = undefined;

    switch (type) {
      case 'url': {
        if (!url.trim()) {
          Alert.alert('Validation Error', 'Please enter a valid website URL.');
          return;
        }
        payload = QRFormatter.formatURL({ url });
        title = url.trim();
        break;
      }
      case 'text': {
        if (!text.trim()) {
          Alert.alert('Validation Error', 'Please enter text content for the QR code.');
          return;
        }
        payload = QRFormatter.formatText({ text });
        title = text.length > 25 ? `${text.substring(0, 22)}...` : text;
        break;
      }
      case 'wifi': {
        if (!wifiSsid.trim()) {
          Alert.alert('Validation Error', 'Please enter Wi-Fi network name (SSID).');
          return;
        }
        payload = QRFormatter.formatWifi({
          ssid: wifiSsid,
          password: wifiPass,
          security: wifiSecurity,
          hidden: wifiHidden,
        });
        title = `Wi-Fi: ${wifiSsid.trim()}`;
        break;
      }
      case 'phone': {
        if (!phoneNumber.trim()) {
          Alert.alert('Validation Error', 'Please enter a phone number.');
          return;
        }
        payload = QRFormatter.formatPhone({ countryCode: phoneCode, phoneNumber });
        title = `Call: ${phoneCode} ${phoneNumber.trim()}`;
        break;
      }
      case 'email': {
        if (!emailTo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo.trim())) {
          Alert.alert('Validation Error', 'Please enter a valid recipient email address.');
          return;
        }
        payload = QRFormatter.formatEmail({
          email: emailTo,
          subject: emailSubject,
          body: emailBody,
        });
        title = `Email: ${emailTo.trim()}`;
        break;
      }
      case 'sms': {
        if (!smsPhone.trim()) {
          Alert.alert('Validation Error', 'Please enter recipient phone number.');
          return;
        }
        payload = QRFormatter.formatSMS({ phoneNumber: smsPhone, message: smsMessage });
        title = `SMS: ${smsPhone.trim()}`;
        break;
      }
      case 'contact': {
        if (!contactName.trim()) {
          Alert.alert('Validation Error', 'Please enter the full contact name.');
          return;
        }
        payload = QRFormatter.formatContact({
          fullName: contactName,
          phone: contactPhone,
          email: contactEmail,
          company: contactCompany,
          website: contactWebsite,
          address: contactAddress,
        });
        title = `Contact: ${contactName.trim()}`;
        break;
      }
      case 'location': {
        if (!locLat.trim() || !locLng.trim()) {
          Alert.alert('Validation Error', 'Please enter both latitude and longitude coordinates.');
          return;
        }
        payload = QRFormatter.formatLocation({
          latitude: locLat,
          longitude: locLng,
          label: locLabel,
        });
        title = locLabel.trim() || `Location: ${locLat}, ${locLng}`;
        break;
      }
      case 'order_id': {
        const cleanOrderId = orderId.trim();
        if (!cleanOrderId) {
          Alert.alert('Validation Error', 'Enter a valid Order ID.');
          return;
        }

        // Allow letters, numbers, -, _, /
        const validOrderRegex = /^[a-zA-Z0-9_\-\/]+$/;
        if (!validOrderRegex.test(cleanOrderId)) {
          Alert.alert(
            'Invalid Order ID',
            'Order ID may only contain letters, numbers, hyphens (-), underscores (_), and slashes (/).'
          );
          return;
        }

        payload = QRFormatter.formatOrderId({
          orderId: cleanOrderId,
          customerName: orderCustomer.trim(),
          reference: orderReference.trim(),
          note: orderNote.trim(),
        });
        title = `Order: ${cleanOrderId}`;
        break;
      }
      case 'json': {
        const rawJson = jsonText.trim();
        if (!rawJson) {
          Alert.alert('Validation Error', 'Please enter JSON data.');
          return;
        }

        try {
          const parsed = JSON.parse(rawJson);
          // Check size limit (~2200 chars for standard high-readability QR codes)
          if (rawJson.length > 2200) {
            Alert.alert(
              'JSON Data Too Large',
              'JSON data is too large for a standard QR code. Please reduce JSON size, remove unnecessary fields, or use a URL reference instead.'
            );
            return;
          }
          payload = JSON.stringify(parsed, null, 2);
          title = `JSON: ${Object.keys(parsed).slice(0, 2).join(', ') || 'Payload'}`;
        } catch (e: any) {
          setJsonError('Invalid JSON: ' + (e.message || 'Syntax error'));
          Alert.alert('Invalid JSON format', 'Please check your JSON syntax before generating QR.');
          return;
        }
        break;
      }
      case 'photo': {
        if (!selectedPhoto) {
          Alert.alert('No Photo Selected', 'Please choose a photo to generate a Photo QR code.');
          return;
        }

        // 1. Check if already uploaded and cached
        const cached = uploadCache.current[selectedPhoto.uri];
        if (cached && cached.url && cached.url.startsWith('https://')) {
          payload = cached.url;
          title = `Photo: ${cached.filename}`;
          fileMeta = cached;
          break;
        }

        // 2. Pre-check network state to fail fast if offline
        try {
          const netState = await Network.getNetworkStateAsync();
          if (netState.isConnected === false) {
            Alert.alert(
              'No Internet Connection',
              'An active internet connection is required to upload photos and generate shareable QR codes.'
            );
            return;
          }
        } catch {}

        try {
          setIsUploading(true);
          setUploadProgress(10);
          setUploadDetailText(`Uploading ${selectedPhoto.name}...`);

          const result = await FileUploadService.uploadFile(
            selectedPhoto.uri,
            selectedPhoto.name,
            'photo',
            selectedPhoto.mimeType,
            selectedPhoto.size,
            (p, sent, total) => {
              setUploadProgress(p);
              if (sent && total) {
                setUploadDetailText(`Uploading... ${p}% (${FileUploadService.formatBytes(sent)} / ${FileUploadService.formatBytes(total)})`);
              }
            }
          );

          payload = result.url || result.view_url || result.qr_url || '';

          if (
            !payload ||
            payload.includes('localhost') ||
            payload.includes('127.0.0.1') ||
            payload.includes('192.168.') ||
            payload.includes('10.0.') ||
            payload.startsWith('file://') ||
            payload.startsWith('content://') ||
            payload.includes('tmpfiles.org') ||
            !payload.startsWith('https://')
          ) {
            Alert.alert(
              'Public HTTPS URL Required',
              `Cannot create a shareable QR.\n\nThe uploaded file does not have a public HTTPS URL (got: ${payload || 'empty'}). Ensure Supabase Storage is configured in backend/.env.`
            );
            return;
          }

          // Cache upload result
          uploadCache.current[selectedPhoto.uri] = result;

          title = `Photo: ${result.filename}`;
          fileMeta = {
            filename: result.filename,
            original_name: result.original_name || result.filename,
            size_formatted: result.size_formatted,
            file_type: 'photo' as const,
            content_type: result.content_type,
            file_category: result.file_category || 'image',
            file_type_label: result.file_type_label || 'Image File',
            storage_path: result.storage_path,
            storage_provider: result.storage_provider || 'supabase',
            is_supabase: result.is_supabase ?? true,
          };
        } catch (e: any) {
          setIsUploading(false);
          Alert.alert('Upload Failed', e.message || 'Could not upload photo to server.');
          return;
        } finally {
          setIsUploading(false);
        }
        break;
      }
      case 'file': {
        if (!selectedPdf) {
          Alert.alert('No File Selected', 'Please choose a file or document to generate a File QR code.');
          return;
        }

        // 1. Check if already uploaded and cached
        const cached = uploadCache.current[selectedPdf.uri];
        if (cached && cached.url && cached.url.startsWith('https://')) {
          payload = cached.url;
          const label = cached.file_type_label || (cached.filename?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'File');
          title = `${label}: ${cached.filename}`;
          fileMeta = {
            filename: cached.filename,
            original_name: cached.original_name || cached.filename,
            size_formatted: cached.size_formatted,
            file_type: 'file' as const,
            content_type: cached.content_type,
            file_category: cached.file_category,
            file_type_label: cached.file_type_label,
            storage_path: cached.storage_path,
            storage_provider: cached.storage_provider || 'supabase',
            is_supabase: cached.is_supabase ?? true,
          };
          break;
        }

        // 2. Pre-check network state to fail fast if offline
        try {
          const netState = await Network.getNetworkStateAsync();
          if (netState.isConnected === false) {
            Alert.alert(
              'No Internet Connection',
              'An active internet connection is required to upload documents and generate shareable QR codes.'
            );
            return;
          }
        } catch {}

        try {
          setIsUploading(true);
          setUploadProgress(10);
          setUploadDetailText(`Uploading ${selectedPdf.name}...`);

          const result = await FileUploadService.uploadFile(
            selectedPdf.uri,
            selectedPdf.name,
            'file',
            selectedPdf.mimeType,
            selectedPdf.size,
            (p, sent, total) => {
              setUploadProgress(p);
              if (sent && total) {
                setUploadDetailText(`Uploading... ${p}% (${FileUploadService.formatBytes(sent)} / ${FileUploadService.formatBytes(total)})`);
              }
            }
          );

          payload = result.url || result.view_url || result.qr_url || '';

          if (
            !payload ||
            payload.includes('localhost') ||
            payload.includes('127.0.0.1') ||
            payload.includes('192.168.') ||
            payload.includes('10.0.') ||
            payload.startsWith('file://') ||
            payload.startsWith('content://') ||
            payload.includes('tmpfiles.org') ||
            !payload.startsWith('https://')
          ) {
            Alert.alert(
              'Public HTTPS URL Required',
              `Cannot create a shareable QR.\n\nThe uploaded file does not have a public HTTPS URL (got: ${payload || 'empty'}). Ensure Supabase Storage is configured in backend/.env.`
            );
            return;
          }

          // Cache upload result
          uploadCache.current[selectedPdf.uri] = result;

          const label = result.file_type_label || (result.filename?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'File');
          title = `${label}: ${result.filename}`;
          fileMeta = {
            filename: result.filename,
            original_name: result.original_name || result.filename,
            size_formatted: result.size_formatted,
            file_type: 'file' as const,
            content_type: result.content_type,
            file_category: result.file_category,
            file_type_label: result.file_type_label,
            storage_path: result.storage_path,
            storage_provider: result.storage_provider || 'supabase',
            is_supabase: result.is_supabase ?? true,
          };
        } catch (e: any) {
          setIsUploading(false);
          Alert.alert('Upload Failed', e.message || 'Could not upload document to server.');
          return;
        } finally {
          setIsUploading(false);
        }
        break;
      }
    }

    if (!payload) return;

    triggerFeedback();
    navigation.navigate('QRPreview', {
      type,
      data: payload,
      title,
      customization,
      fileMeta,
      isVerified: true,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title={`Create ${meta.label}`}
          showBack
          onBack={() => navigation.goBack()}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* URL Form */}
        {type === 'url' && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Website URL *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
              ]}
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com"
              placeholderTextColor={theme.textMuted}
              keyboardType="url"
              autoCapitalize="none"
            />
            {url.trim().length > 0 && (
              <URLPreviewCard
                url={url}
                onSelectShortcut={(shortcut) => setUrl((prev) => `${prev}${shortcut}`)}
                onClear={() => setUrl('')}
              />
            )}
          </View>
        )}

        {/* Plain Text Form */}
        {type === 'text' && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Text Content *</Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
              ]}
              value={text}
              onChangeText={setText}
              placeholder="Type your message, notes, serial number, or code..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* Wi-Fi Form */}
        {type === 'wifi' && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Network Name (SSID) *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={wifiSsid}
                onChangeText={setWifiSsid}
                placeholder="e.g. MyHome_5G"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Security Type</Text>
              <View style={styles.securitySelector}>
                {(['WPA', 'WEP', 'nopass'] as const).map((sec) => (
                  <Pressable
                    key={sec}
                    onPress={() => setWifiSecurity(sec)}
                    style={[
                      styles.secBtn,
                      {
                        backgroundColor:
                          wifiSecurity === sec
                            ? theme.primary
                            : theme.surfaceVariant,
                        borderColor:
                          wifiSecurity === sec
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secBtnText,
                        {
                          color:
                            wifiSecurity === sec
                              ? '#FFFFFF'
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      {sec === 'WPA' ? 'WPA/WPA2' : sec === 'WEP' ? 'WEP' : 'Open (No Pass)'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {wifiSecurity !== 'nopass' && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                    ]}
                    value={wifiPass}
                    onChangeText={setWifiPass}
                    placeholder="Enter network password"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showWifiPass}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowWifiPass(!showWifiPass)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showWifiPass ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.textMuted}
                    />
                  </Pressable>
                </View>
              </View>
            )}

            <View style={[styles.switchRow, { borderColor: theme.borderLight }]}>
              <View>
                <Text style={[styles.switchLabel, { color: theme.text }]}>Hidden Network</Text>
                <Text style={[styles.switchSub, { color: theme.textMuted }]}>SSID is not broadcast publicly</Text>
              </View>
              <Switch
                value={wifiHidden}
                onValueChange={setWifiHidden}
                trackColor={{ false: theme.border, true: theme.primaryLight }}
                thumbColor={wifiHidden ? theme.primary : '#FFFFFF'}
              />
            </View>
          </>
        )}

        {/* Phone Form */}
        {type === 'phone' && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
            <View style={styles.phoneRow}>
              <TextInput
                style={[
                  styles.countryCodeInput,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={phoneCode}
                onChangeText={setPhoneCode}
                placeholder="+1"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="(555) 000-0000"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}

        {/* Email Form */}
        {type === 'email' && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Recipient Email Address *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={emailTo}
                onChangeText={setEmailTo}
                placeholder="name@example.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Subject Line (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholder="Inquiry / Feedback"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Message Body (Optional)</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={emailBody}
                onChangeText={setEmailBody}
                placeholder="Pre-filled email message body..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}

        {/* SMS Form */}
        {type === 'sms' && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Recipient Phone Number *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={smsPhone}
                onChangeText={setSmsPhone}
                placeholder="+1 555 123 4567"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>SMS Text (Optional)</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={smsMessage}
                onChangeText={setSmsMessage}
                placeholder="Pre-filled text message..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}

        {/* Contact Form */}
        {type === 'contact' && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Full Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={contactName}
                onChangeText={setContactName}
                placeholder="Jane Doe"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="jane@company.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Company / Organization</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={contactCompany}
                onChangeText={setContactCompany}
                placeholder="Acme Corporation"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Website</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={contactWebsite}
                onChangeText={setContactWebsite}
                placeholder="https://company.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Address</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={contactAddress}
                onChangeText={setContactAddress}
                placeholder="123 Market St, San Francisco, CA"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </>
        )}

        {/* Location Form */}
        {type === 'location' && (
          <>
            <View style={styles.geoRow}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={[styles.label, { color: theme.text }]}>Latitude *</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  value={locLat}
                  onChangeText={setLocLat}
                  placeholder="37.7749"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.text }]}>Longitude *</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  value={locLng}
                  onChangeText={setLocLng}
                  placeholder="-122.4194"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Location Label (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={locLabel}
                onChangeText={setLocLabel}
                placeholder="Headquarters Office"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </>
        )}

        {/* Order ID Form */}
        {type === 'order_id' && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Order ID *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={orderId}
                onChangeText={setOrderId}
                placeholder="e.g. ORD-2026-000123, ORDER_1001"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="characters"
              />
              <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
                Allowed: letters, numbers, hyphens (-), underscores (_), and slashes (/)
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Customer Name (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={orderCustomer}
                onChangeText={setOrderCustomer}
                placeholder="e.g. Kiruthikeyan S"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Order Reference (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={orderReference}
                onChangeText={setOrderReference}
                placeholder="e.g. REF-INVOICE-88"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Note (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={orderNote}
                onChangeText={setOrderNote}
                placeholder="e.g. Priority Express Shipping"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </>
        )}

        {/* JSON Form */}
        {type === 'json' && (
          <>
            <View style={styles.fieldGroup}>
              <View style={styles.jsonHeaderRow}>
                <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>
                  JSON Data Content *
                </Text>
                <View style={styles.jsonActionsRow}>
                  <Pressable
                    onPress={handleFormatJson}
                    style={[styles.smallJsonBtn, { backgroundColor: theme.surfaceVariant }]}
                  >
                    <Ionicons name="code-working-outline" size={14} color={theme.primary} />
                    <Text style={[styles.smallJsonBtnText, { color: theme.primary }]}>Format JSON</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleClearJson}
                    style={[styles.smallJsonBtn, { backgroundColor: theme.surfaceVariant, marginLeft: 6 }]}
                  >
                    <Ionicons name="trash-outline" size={14} color={palette.rose[500]} />
                    <Text style={[styles.smallJsonBtnText, { color: palette.rose[500] }]}>Clear</Text>
                  </Pressable>
                </View>
              </View>

              <TextInput
                style={[
                  styles.jsonTextArea,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderColor: jsonError ? palette.rose[500] : theme.inputBorder,
                    color: isDark ? '#38bdf8' : '#0f172a',
                  },
                ]}
                value={jsonText}
                onChangeText={(val) => {
                  setJsonText(val);
                  if (jsonError) setJsonError(null);
                }}
                placeholder='{\n  "key": "value"\n}'
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={8}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {jsonError ? (
                <Text style={[styles.errorText, { color: palette.rose[500] }]}>{jsonError}</Text>
              ) : (
                <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
                  Character count: {jsonText.trim().length} / 2200 max recommended
                </Text>
              )}
            </View>
          </>
        )}

        {/* Photo QR Form */}
        {type === 'photo' && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Upload Photo *</Text>
            {selectedPhoto ? (
              <View style={[styles.fileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Image source={{ uri: selectedPhoto.uri }} style={styles.photoThumb} />
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                    {selectedPhoto.name}
                  </Text>
                  <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                    {FileUploadService.formatBytes(selectedPhoto.size)} • JPG/PNG
                  </Text>
                </View>
                <View style={styles.fileActionBtnsRow}>
                  <Pressable
                    onPress={() => setPreviewModalVisible(true)}
                    style={[styles.smallBtn, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : palette.emerald[50] }]}
                  >
                    <Ionicons name="eye-outline" size={14} color={palette.emerald[600]} />
                    <Text style={[styles.smallBtnText, { color: palette.emerald[600] }]}>Preview</Text>
                  </Pressable>
                  <Pressable
                    onPress={handlePickPhoto}
                    style={[styles.smallBtn, { backgroundColor: theme.surfaceVariant }]}
                  >
                    <Ionicons name="refresh-outline" size={14} color={theme.text} />
                    <Text style={[styles.smallBtnText, { color: theme.text }]}>Change</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleRemovePhoto}
                    style={[styles.smallBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : palette.rose[50] }]}
                  >
                    <Ionicons name="trash-outline" size={14} color={palette.rose[500]} />
                    <Text style={[styles.smallBtnText, { color: palette.rose[500] }]}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={handlePickPhoto}
                style={({ pressed }) => [
                  styles.uploadBox,
                  { backgroundColor: theme.surfaceVariant, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={[styles.uploadIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : palette.emerald[50] }]}>
                  <Ionicons name="image-outline" size={32} color={palette.emerald[500]} />
                </View>
                <Text style={[styles.uploadTitle, { color: theme.text }]}>Select & Upload Photo</Text>
                <Text style={[styles.uploadSubtitle, { color: theme.textSecondary }]}>
                  Supported: JPG, JPEG, PNG, WEBP • Max 10 MB
                </Text>
                <View style={[styles.uploadPillBtn, { backgroundColor: theme.primary }]}>
                  <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.uploadPillText}>Choose Image</Text>
                </View>
              </Pressable>
            )}
          </View>
        )}

        {/* PDF / File QR Form */}
        {type === 'file' && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Upload PDF Document *</Text>
            {selectedPdf ? (
              <View style={[styles.fileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.docIconBox, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.18)' : palette.cyan[50] }]}>
                  <Ionicons name="document-text" size={24} color={palette.cyan[500]} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                    {selectedPdf.name}
                  </Text>
                  <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                    {FileUploadService.formatBytes(selectedPdf.size)} • PDF Document
                  </Text>
                </View>
                <View style={styles.fileActionBtnsRow}>
                  <Pressable
                    onPress={handlePickPdf}
                    style={[styles.smallBtn, { backgroundColor: theme.surfaceVariant }]}
                  >
                    <Ionicons name="refresh-outline" size={14} color={theme.text} />
                    <Text style={[styles.smallBtnText, { color: theme.text }]}>Change</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleRemovePdf}
                    style={[styles.smallBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : palette.rose[50] }]}
                  >
                    <Ionicons name="trash-outline" size={14} color={palette.rose[500]} />
                    <Text style={[styles.smallBtnText, { color: palette.rose[500] }]}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={handlePickPdf}
                style={({ pressed }) => [
                  styles.uploadBox,
                  { backgroundColor: theme.surfaceVariant, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={[styles.uploadIconCircle, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.18)' : palette.cyan[50] }]}>
                  <Ionicons name="document-attach-outline" size={32} color={palette.cyan[500]} />
                </View>
                <Text style={[styles.uploadTitle, { color: theme.text }]}>Select & Upload PDF</Text>
                <Text style={[styles.uploadSubtitle, { color: theme.textSecondary }]}>
                  Supported: PDF, Documents • Max 25 MB
                </Text>
                <View style={[styles.uploadPillBtn, { backgroundColor: palette.cyan[600] }]}>
                  <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.uploadPillText}>Choose PDF</Text>
                </View>
              </Pressable>
            )}
          </View>
        )}

        {/* Pre-selection Placeholder for Photo & PDF */}
        {!isFileSelected && (
          <View style={[styles.placeholderCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.borderLight }]}>
            <Ionicons name="color-palette-outline" size={24} color={theme.textMuted} style={{ marginBottom: 6 }} />
            <Text style={[styles.placeholderTitle, { color: theme.text }]}>
              {type === 'photo' ? 'Select a photo first' : 'Select a PDF first'}
            </Text>
            <Text style={[styles.placeholderSubtitle, { color: theme.textSecondary }]}>
              Once selected, live QR preview and styling options will appear.
            </Text>
          </View>
        )}

        {/* Live QR Preview Box (Shown only when file is selected or for standard text/URL types) */}
        {isFileSelected && (
          <View style={[styles.previewSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.previewTitle, { color: theme.textSecondary }]}>LIVE QR PREVIEW</Text>
            <View style={styles.qrCenteredWrapper}>
              <CustomQRCode
                value={getPreviewPayload()}
                size={180}
                customization={customization}
              />
            </View>
          </View>
        )}

        {/* QR Customization Section */}
        {isFileSelected && (
          <QRCustomizer
            customization={customization}
            onChange={setCustomization}
          />
        )}

        {/* Upload Progress Indicator */}
        {isUploading && (
          <View style={[styles.uploadingBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.uploadingHeaderRow}>
              <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: spacing.sm }} />
              <Text style={[styles.uploadingText, { color: theme.text }]} numberOfLines={1}>
                {uploadDetailText || 'Uploading file to cloud storage...'}
              </Text>
            </View>
            <View style={[styles.progressBarTrack, { backgroundColor: theme.borderLight }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${Math.max(8, Math.min(100, uploadProgress))}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Submit Generate Button */}
        <PrimaryButton
          title={
            isUploading
              ? 'Uploading & Generating...'
              : !isFileSelected
              ? type === 'photo'
                ? 'Select Photo to Continue'
                : 'Select PDF to Continue'
              : 'Generate QR Code'
          }
          onPress={!isFileSelected ? (type === 'photo' ? handlePickPhoto : handlePickPdf) : handleGenerate}
          size="lg"
          disabled={isUploading}
          style={styles.generateBtn}
        />
      </ScrollView>

      {/* Photo Full-Screen Modal Preview */}
      {selectedPhoto && (
        <Modal
          visible={previewModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.imageModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalImageTitle, { color: theme.text }]} numberOfLines={1}>
                  {selectedPhoto.name}
                </Text>
                <Pressable onPress={() => setPreviewModalVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={22} color={theme.text} />
                </Pressable>
              </View>

              <Image source={{ uri: selectedPhoto.uri }} style={styles.modalFullImage} resizeMode="contain" />

              <View style={styles.modalFooter}>
                <Text style={[styles.modalImageSize, { color: theme.textSecondary }]}>
                  {FileUploadService.formatBytes(selectedPhoto.size)}
                </Text>
                <SecondaryButton
                  title="Close Preview"
                  variant="outline"
                  onPress={() => setPreviewModalVisible(false)}
                  style={{ minWidth: 120 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.base,
  },
  infoBannerText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    fontWeight: typography.fontWeight.medium,
  },
  fieldGroup: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  fieldHint: {
    fontSize: typography.fontSize.xs,
    marginTop: 4,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    marginTop: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
  },
  textArea: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    textAlignVertical: 'top',
  },
  jsonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  jsonActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallJsonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  smallJsonBtnText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  jsonTextArea: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: 'monospace',
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  phoneRow: {
    flexDirection: 'row',
  },
  countryCodeInput: {
    width: 65,
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.base,
    marginRight: spacing.sm,
    textAlign: 'center',
  },
  geoRow: {
    flexDirection: 'row',
  },
  securitySelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secBtn: {
    flex: 1,
    height: 42,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  switchLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  switchSub: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  uploadTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  uploadPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  uploadPillText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  fileCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  photoThumb: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    resizeMode: 'cover',
  },
  docIconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  fileInfo: {
    marginBottom: spacing.md,
  },
  fileName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: typography.fontSize.xs,
  },
  fileActionBtnsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  smallBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: 4,
  },
  placeholderCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  placeholderTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  placeholderSubtitle: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  previewSection: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  qrCenteredWrapper: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  uploadingBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  uploadingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  uploadingText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  generateBtn: {
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  imageModalContent: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#334155',
  },
  modalImageTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
    marginRight: spacing.sm,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalFullImage: {
    width: '100%',
    height: 380,
    backgroundColor: '#0f172a',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#334155',
  },
  modalImageSize: {
    fontSize: typography.fontSize.xs,
  },
});
