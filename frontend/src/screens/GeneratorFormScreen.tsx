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
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { useTheme } from '../theme/ThemeContext';
import { QR_TYPES } from '../constants/config';
import { typography, borderRadius, spacing } from '../theme/typography';
import { URLPreviewCard } from '../components/URLPreviewCard';
import { QRFormatter } from '../utils/qrFormatter';
import { triggerLightHaptic } from '../utils/feedback';

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

  const handleGenerate = () => {
    let payload = '';
    let title = meta.label;

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
    }

    if (!payload) return;

    navigation.navigate('QRPreview', {
      type,
      data: payload,
      title,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title={`Create ${meta.label}`}
          subtitle="Fill in the details below"
          showBack
          onBack={() => navigation.goBack()}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Header Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: isDark ? meta.badgeBgDark : meta.badgeBgLight }]}>
          <Ionicons name={meta.iconName as any} size={24} color={meta.color} style={{ marginRight: spacing.md }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: meta.color }]}>{meta.label}</Text>
            <Text style={[styles.infoDesc, { color: theme.textSecondary }]}>{meta.description}</Text>
          </View>
        </View>

        {/* Dynamic Fields */}
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
              placeholder="e.g. google.com or https://mysite.com"
              placeholderTextColor={theme.textMuted}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.helpText, { color: theme.textMuted }]}>
              Protocol (https://) will be automatically added if omitted.
            </Text>

            {/* Live Interactive URL Preview Card */}
            <URLPreviewCard
              url={url}
              onSelectShortcut={(val) => {
                if (val.startsWith('http') || val.includes('.')) {
                  setUrl(val);
                } else {
                  setUrl((prev) => `${prev}${val}`);
                }
              }}
              onClear={() => setUrl('')}
            />
          </View>
        )}

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
              placeholder="Enter any note, code, or message here..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={5}
            />
            <Text style={[styles.helpText, { color: theme.textMuted }]}>
              {text.length} characters
            </Text>
          </View>
        )}

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
                placeholder="e.g. Home_Wi-Fi_5G"
                placeholderTextColor={theme.textMuted}
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Security Type</Text>
              <View style={styles.securityPills}>
                {(['WPA', 'WEP', 'nopass'] as const).map((sec) => (
                  <Pressable
                    key={sec}
                    onPress={() => {
                      triggerLightHaptic();
                      setWifiSecurity(sec);
                    }}
                    style={[
                      styles.secPill,
                      {
                        backgroundColor: wifiSecurity === sec ? theme.primary : theme.surfaceVariant,
                        borderColor: wifiSecurity === sec ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secPillText,
                        { color: wifiSecurity === sec ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {sec === 'WPA' ? 'WPA/WPA2' : sec === 'WEP' ? 'WEP' : 'No Password'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {wifiSecurity !== 'nopass' && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                    ]}
                    value={wifiPass}
                    onChangeText={setWifiPass}
                    placeholder="Enter network password"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showWifiPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={() => setShowWifiPass(!showWifiPass)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showWifiPass ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>
            )}

            <View style={[styles.switchRow, { borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>Hidden Network</Text>
                <Text style={[styles.switchSub, { color: theme.textSecondary }]}>
                  Enable if the SSID is not broadcasting publicly
                </Text>
              </View>
              <Switch
                value={wifiHidden}
                onValueChange={(val) => {
                  triggerLightHaptic();
                  setWifiHidden(val);
                }}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>
          </>
        )}

        {type === 'phone' && (
          <View style={styles.phoneRow}>
            <View style={{ width: 90, marginRight: spacing.sm }}>
              <Text style={[styles.label, { color: theme.text }]}>Code</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={phoneCode}
                onChangeText={setPhoneCode}
                placeholder="+1"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="4155552671"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}

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
                placeholder="recipient@example.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Subject (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholder="e.g. Meeting Inquiry"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Message (Optional)</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={emailBody}
                onChangeText={setEmailBody}
                placeholder="Enter pre-filled email body..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>
          </>
        )}

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
                placeholder="+14155552671"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>SMS Text Message</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={smsMessage}
                onChangeText={setSmsMessage}
                placeholder="Enter text message..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}

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
                placeholder="e.g. Sarah Connor"
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
                placeholder="+1 555-0199"
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
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Website</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={contactWebsite}
                onChangeText={setContactWebsite}
                placeholder="https://company.org"
                placeholderTextColor={theme.textMuted}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Postal Address</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={contactAddress}
                onChangeText={setContactAddress}
                placeholder="100 Tech Blvd, Silicon Valley, CA"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </>
        )}

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
                placeholder="e.g. San Francisco Office"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </>
        )}

        {/* Generate Button */}
        <PrimaryButton
          title="Generate QR Code"
          icon="qr-code"
          onPress={handleGenerate}
          style={styles.generateButton}
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
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  infoDesc: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
  },
  textArea: {
    minHeight: 100,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: typography.fontSize.xs,
    marginTop: 4,
  },
  securityPills: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  secPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    paddingRight: 45,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: spacing.xl,
  },
  switchLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  switchSub: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  generateButton: {
    marginTop: spacing.md,
  },
});
