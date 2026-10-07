import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { BarcodeRenderer } from '../components/BarcodeRenderer';
import { BarcodeEncoder, BarcodeFormat } from '../utils/barcodeEncoder';
import { SavedQRStorage } from '../storage/savedQRStorage';
import { NotificationStorage } from '../storage/notificationStorage';
import { ActionHandler } from '../utils/actionHandler';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius, spacing } from '../theme/typography';
import { triggerLightHaptic, triggerFeedback } from '../utils/feedback';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FORMAT_OPTIONS: { label: string; value: BarcodeFormat; placeholder: string; hint: string }[] = [
  {
    label: 'Code 128',
    value: 'CODE128',
    placeholder: 'e.g. SHIP123456',
    hint: 'Universal alphanumeric barcode for shipping, inventory, and labels.',
  },
  {
    label: 'Code 39',
    value: 'CODE39',
    placeholder: 'e.g. PART-9876',
    hint: 'Uppercase letters A-Z, digits 0-9, and symbols - . $ / + %.',
  },
  {
    label: 'EAN-13',
    value: 'EAN13',
    placeholder: 'e.g. 890123456789',
    hint: '12 or 13 numeric digits for international retail products.',
  },
  {
    label: 'EAN-8',
    value: 'EAN8',
    placeholder: 'e.g. 9638507',
    hint: '7 or 8 numeric digits for compact packages.',
  },
  {
    label: 'UPC-A',
    value: 'UPCA',
    placeholder: 'e.g. 01234567890',
    hint: '11 or 12 numeric digits for North American retail items.',
  },
  {
    label: 'UPC-E',
    value: 'UPCE',
    placeholder: 'e.g. 0123456',
    hint: '6 to 8 numeric digits compressed UPC barcode.',
  },
];

export const BarcodeGeneratorScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [selectedFormat, setSelectedFormat] = useState<BarcodeFormat>('CODE128');
  const [barcodeValue, setBarcodeValue] = useState('SHIP123456');
  const [isSaved, setIsSaved] = useState(false);

  const currentOption =
    FORMAT_OPTIONS.find((f) => f.value === selectedFormat) || FORMAT_OPTIONS[0];

  const validation = BarcodeEncoder.encode(barcodeValue, selectedFormat);

  const handleCopy = async () => {
    triggerLightHaptic();
    const ok = await ActionHandler.copyToClipboard(barcodeValue);
    if (ok) {
      Alert.alert('Copied', 'Barcode value copied to clipboard.');
    }
  };

  const handleShare = async () => {
    triggerLightHaptic();
    await ActionHandler.shareText(`Barcode (${selectedFormat}): ${barcodeValue}`, barcodeValue);
  };

  const handleSave = async () => {
    if (!validation.valid) {
      Alert.alert('Invalid Barcode', validation.error || 'Please enter a valid barcode value.');
      return;
    }

    const saved = await SavedQRStorage.add({
      name: `Barcode: ${barcodeValue.trim()}`,
      type: 'barcode',
      data: barcodeValue.trim(),
    });

    await NotificationStorage.add({
      title: 'Barcode Saved',
      message: `"${barcodeValue.trim()}" (${selectedFormat}) saved to your collection.`,
      type: 'saved',
      data: { savedId: saved.id, name: barcodeValue.trim(), qrType: 'barcode', data: barcodeValue.trim() },
    });

    setIsSaved(true);
    triggerFeedback();
    Alert.alert('Saved Successfully', `Barcode "${barcodeValue.trim()}" has been saved.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title="Create Barcode"
          subtitle="Generate linear product & inventory barcodes"
          showBack
          onBack={() => navigation.goBack()}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Format Selector Pills */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>SELECT BARCODE FORMAT</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formatScroll}>
          {FORMAT_OPTIONS.map((item) => {
            const isSelected = selectedFormat === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => {
                  triggerLightHaptic();
                  setSelectedFormat(item.value);
                  setIsSaved(false);
                }}
                style={[
                  styles.formatChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surfaceVariant,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.formatChipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Input Value Box */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Barcode Value *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: validation.valid ? theme.inputBorder : palette.rose[500],
                color: theme.text,
              },
            ]}
            value={barcodeValue}
            onChangeText={(t) => {
              setBarcodeValue(t);
              setIsSaved(false);
            }}
            placeholder={currentOption.placeholder}
            placeholderTextColor={theme.textMuted}
            autoCapitalize="characters"
          />
          <Text style={[styles.hintText, { color: validation.valid ? theme.textSecondary : palette.rose[500] }]}>
            {validation.valid ? currentOption.hint : validation.error}
          </Text>
        </View>

        {/* Live Barcode Preview Card */}
        <View style={[styles.previewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.previewHeader}>
            <View style={[styles.typeBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.typeBadgeText, { color: theme.primary }]}>{selectedFormat}</Text>
            </View>
            <Text style={[styles.verifiedText, { color: validation.valid ? palette.emerald[600] : palette.rose[500] }]}>
              {validation.valid ? '✓ Valid Format' : '⚠ Invalid Format'}
            </Text>
          </View>

          <View style={styles.barcodeBox}>
            <BarcodeRenderer
              value={barcodeValue}
              format={selectedFormat}
              width={260}
              height={90}
              barColor="#000000"
              bgColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Primary & Secondary Actions */}
        <PrimaryButton
          title={isSaved ? 'Saved in Collection' : 'Save Barcode'}
          icon={isSaved ? 'checkmark-circle' : 'bookmark'}
          variant="emerald"
          onPress={handleSave}
          disabled={!validation.valid}
          style={styles.actionBtn}
        />

        <View style={styles.secondaryGrid}>
          <SecondaryButton
            title="Share Barcode"
            icon="share-social-outline"
            variant="outline"
            onPress={handleShare}
            disabled={!validation.valid}
            style={styles.gridBtn}
          />
          <SecondaryButton
            title="Copy Value"
            icon="copy-outline"
            variant="outline"
            onPress={handleCopy}
            disabled={!validation.valid}
            style={styles.gridBtn}
          />
        </View>
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
  sectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  formatScroll: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  formatChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  formatChipText: {
    fontSize: typography.fontSize.xs,
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
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    marginTop: 6,
    lineHeight: 16,
  },
  previewCard: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  previewHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  verifiedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  barcodeBox: {
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  actionBtn: {
    marginBottom: spacing.md,
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gridBtn: {
    flex: 1,
  },
});
