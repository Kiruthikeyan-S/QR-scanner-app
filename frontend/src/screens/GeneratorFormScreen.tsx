import React, { useState } from 'react';
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
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { RootStackParamList } from '../types/navigation';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
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

  // Photo & File States
  const [selectedPhoto, setSelectedPhoto] = useState<{
    uri: string;
    name: string;
    size: number;
    mimeType?: string;
  } | null>(null);

  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size: number;
    mimeType?: string;
  } | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Customization State
  const [customization, setCustomization] = useState<QRCustomization>({
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    size: 220,
    errorCorrectionLevel: 'M',
  });

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
        quality: 0.9,
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

  // Document Picker Handler
  const handlePickFile = async () => {
    try {
      triggerLightHaptic();
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const size = asset.size || 0;
        const name = asset.name || 'document.pdf';

        if (size > 25 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Files must be 25 MB or smaller.');
          return;
        }

        setSelectedFile({
          uri: asset.uri,
          name,
          size,
          mimeType: asset.mimeType || 'application/pdf',
        });
      }
    } catch (e: any) {
      Alert.alert('Picker Error', e.message || 'Failed to select document.');
    }
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
        return selectedPhoto ? `https://qrsmart.app/files/view/P-${selectedPhoto.name}` : 'https://qrsmart.app/files/photo';
      case 'file':
        return selectedFile ? `https://qrsmart.app/files/view/F-${selectedFile.name}` : 'https://qrsmart.app/files/document';
      default:
        return 'https://qrsmart.app';
    }
  };

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
      case 'photo': {
        if (!selectedPhoto) {
          Alert.alert('No Photo Selected', 'Please choose a photo to generate a Photo QR code.');
          return;
        }

        try {
          setIsUploading(true);
          setUploadProgress(15);

          const result = await FileUploadService.uploadFile(
            selectedPhoto.uri,
            selectedPhoto.name,
            'photo',
            selectedPhoto.mimeType,
            selectedPhoto.size,
            (p) => setUploadProgress(p)
          );

          payload = result.qr_url;
          title = `Photo: ${result.filename}`;
          fileMeta = {
            filename: result.filename,
            size_formatted: result.size_formatted,
            file_type: 'photo' as const,
            content_type: result.content_type,
          };
        } catch (e: any) {
          setIsUploading(false);
          Alert.alert('Upload Failed', e.message || 'Could not upload photo to server. Check network.');
          return;
        } finally {
          setIsUploading(false);
        }
        break;
      }
      case 'file': {
        if (!selectedFile) {
          Alert.alert('No File Selected', 'Please choose a PDF or document file to generate a File QR code.');
          return;
        }

        try {
          setIsUploading(true);
          setUploadProgress(15);

          const result = await FileUploadService.uploadFile(
            selectedFile.uri,
            selectedFile.name,
            'file',
            selectedFile.mimeType,
            selectedFile.size,
            (p) => setUploadProgress(p)
          );

          payload = result.qr_url;
          title = `File: ${result.filename}`;
          fileMeta = {
            filename: result.filename,
            size_formatted: result.size_formatted,
            file_type: 'file' as const,
            content_type: result.content_type,
          };
        } catch (e: any) {
          setIsUploading(false);
          Alert.alert('Upload Failed', e.message || 'Could not upload file to server. Check network.');
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
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title={`Create ${meta.label}`}
          subtitle={
            type === 'photo' || type === 'file'
              ? 'Upload file & create secure QR'
              : 'Fill in details & customize style'
          }
          showBack
          onBack={() => navigation.goBack()}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: isDark ? meta.badgeBgDark : meta.badgeBgLight }]}>
          <Ionicons name={meta.iconName as any} size={20} color={meta.color} style={{ marginRight: spacing.sm }} />
          <Text style={[styles.infoBannerText, { color: theme.text }]}>
            {type === 'photo'
              ? 'Uploads photo securely and generates a scannable preview link (Max 10 MB).'
              : type === 'file'
              ? 'Uploads PDF/documents securely and generates a download link (Max 25 MB).'
              : meta.description}
          </Text>
        </View>

        {/* URL Form */}
        {type === 'url' && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Website URL *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={url}
                onChangeText={setUrl}
                placeholder="https://yourwebsite.com"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <URLPreviewCard
              url={url}
              onSelectShortcut={(shortcut) => setUrl(shortcut)}
              onClear={() => setUrl('')}
            />
          </>
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
              placeholder="Enter notes, numbers, or message..."
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
                placeholder="e.g. Home_Network_5G"
                placeholderTextColor={theme.textMuted}
              />
            </View>
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
                  placeholder="Enter Wi-Fi password"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showWifiPass}
                />
                <Pressable onPress={() => setShowWifiPass(!showWifiPass)} style={styles.passToggle}>
                  <Ionicons
                    name={showWifiPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={theme.textMuted}
                  />
                </Pressable>
              </View>
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.text }]}>Hidden Network</Text>
              <Switch
                value={wifiHidden}
                onValueChange={setWifiHidden}
                trackColor={{ false: theme.border, true: theme.primary }}
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
                placeholder="555 123 4567"
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
              <Text style={[styles.label, { color: theme.text }]}>Recipient Email *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={emailTo}
                onChangeText={setEmailTo}
                placeholder="contact@company.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Subject</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholder="Inquiry about services"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Message</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={emailBody}
                onChangeText={setEmailBody}
                placeholder="Hello, I would like to..."
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
              <Text style={[styles.label, { color: theme.text }]}>Recipient Phone *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={smsPhone}
                onChangeText={setSmsPhone}
                placeholder="+1 555 0199"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>SMS Text</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={smsMessage}
                onChangeText={setSmsMessage}
                placeholder="Pre-filled SMS body text..."
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
                placeholder="Sarah Connor"
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
                placeholder="+1 555 0144"
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
                placeholder="sarah@example.com"
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
                placeholder="Cyberdyne Systems"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </>
        )}

        {/* Location Form */}
        {type === 'location' && (
          <>
            <View style={styles.phoneRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
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
              <View style={{ flex: 1 }}>
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

        {/* Photo QR Form */}
        {type === 'photo' && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Select Image (JPG, PNG, WEBP) *</Text>
            {selectedPhoto ? (
              <View style={[styles.fileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Image source={{ uri: selectedPhoto.uri }} style={styles.photoThumb} />
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                    {selectedPhoto.name}
                  </Text>
                  <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                    {FileUploadService.formatBytes(selectedPhoto.size)}
                  </Text>
                </View>
                <Pressable onPress={handlePickPhoto} style={styles.fileActionBtn}>
                  <Text style={[styles.fileActionText, { color: theme.primary }]}>Change</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handlePickPhoto}
                style={({ pressed }) => [
                  styles.uploadBox,
                  { backgroundColor: theme.surfaceVariant, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={[styles.uploadIconCircle, { backgroundColor: palette.emerald[50] }]}>
                  <Ionicons name="image-outline" size={32} color={palette.emerald[600]} />
                </View>
                <Text style={[styles.uploadTitle, { color: theme.text }]}>Upload Photo</Text>
                <Text style={[styles.uploadSubtitle, { color: theme.textSecondary }]}>
                  Tap to browse gallery (Max 10 MB)
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* File / PDF QR Form */}
        {type === 'file' && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Select Document (PDF, DOCX, TXT, ZIP) *</Text>
            {selectedFile ? (
              <View style={[styles.fileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.docIconBox, { backgroundColor: palette.cyan[50] }]}>
                  <Ionicons name="document-text" size={24} color={palette.cyan[600]} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                    {FileUploadService.formatBytes(selectedFile.size)}
                  </Text>
                </View>
                <Pressable onPress={handlePickFile} style={styles.fileActionBtn}>
                  <Text style={[styles.fileActionText, { color: theme.primary }]}>Change</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handlePickFile}
                style={({ pressed }) => [
                  styles.uploadBox,
                  { backgroundColor: theme.surfaceVariant, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={[styles.uploadIconCircle, { backgroundColor: palette.cyan[50] }]}>
                  <Ionicons name="document-attach-outline" size={32} color={palette.cyan[600]} />
                </View>
                <Text style={[styles.uploadTitle, { color: theme.text }]}>Upload File or PDF</Text>
                <Text style={[styles.uploadSubtitle, { color: theme.textSecondary }]}>
                  Tap to browse documents (Max 25 MB)
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Live QR Preview Box */}
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

        {/* QR Customization Section */}
        <QRCustomizer
          customization={customization}
          onChange={setCustomization}
        />

        {/* Upload Progress Indicator */}
        {isUploading && (
          <View style={[styles.uploadingBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: spacing.sm }} />
            <Text style={[styles.uploadingText, { color: theme.text }]}>
              Uploading file to server... {uploadProgress > 0 ? `${uploadProgress}%` : ''}
            </Text>
          </View>
        )}

        {/* Submit Generate Button */}
        <PrimaryButton
          title={isUploading ? 'Uploading & Generating...' : 'Generate QR Code'}
          onPress={handleGenerate}
          size="lg"
          disabled={isUploading}
          style={styles.generateBtn}
        />
      </ScrollView>
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
    marginBottom: spacing.lg,
  },
  infoBannerText: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.sm,
    flex: 1,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
  },
  textArea: {
    height: 100,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.sm,
    textAlignVertical: 'top',
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passToggle: {
    position: 'absolute',
    right: spacing.md,
    top: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  switchLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeInput: {
    width: 70,
    height: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    marginRight: spacing.sm,
  },
  uploadBox: {
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  uploadTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  uploadSubtitle: {
    fontSize: typography.fontSize.xs,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  photoThumb: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
  },
  docIconBox: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  fileName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  fileSize: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  fileActionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fileActionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  previewSection: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  previewTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  qrCenteredWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  uploadingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  generateBtn: {
    marginTop: spacing.md,
  },
});
