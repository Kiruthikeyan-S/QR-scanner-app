import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius, spacing } from '../theme/typography';
import { QRCustomization } from '../types/qr';
import { triggerLightHaptic } from '../utils/feedback';

interface QRCustomizerProps {
  customization: QRCustomization;
  onChange: (customization: QRCustomization) => void;
}

const FG_COLOR_PRESETS = [
  { name: 'Classic Black', color: '#000000' },
  { name: 'Dark Slate', color: '#0F172A' },
  { name: 'Emerald', color: '#059669' },
  { name: 'Indigo', color: '#4F46E5' },
  { name: 'Purple', color: '#7C3AED' },
  { name: 'Rose Red', color: '#E11D48' },
  { name: 'Amber', color: '#D97706' },
  { name: 'Cyan', color: '#0891B2' },
];

const BG_COLOR_PRESETS = [
  { name: 'Pure White', color: '#FFFFFF' },
  { name: 'Light Slate', color: '#F1F5F9' },
  { name: 'Light Emerald', color: '#ECFDF5' },
  { name: 'Light Indigo', color: '#EEF2FF' },
  { name: 'Light Cyan', color: '#ECFEFF' },
  { name: 'Warm Amber', color: '#FFFBEB' },
];

const ICON_CATEGORIES = [
  {
    id: 'general',
    label: 'General',
    icons: [
      { name: 'link-outline', label: 'Link' },
      { name: 'globe-outline', label: 'Globe' },
      { name: 'image-outline', label: 'Photo' },
      { name: 'document-text-outline', label: 'Doc' },
      { name: 'wifi-outline', label: 'Wi-Fi' },
      { name: 'call-outline', label: 'Phone' },
      { name: 'mail-outline', label: 'Email' },
      { name: 'location-outline', label: 'Location' },
      { name: 'cart-outline', label: 'Shop' },
      { name: 'heart-outline', label: 'Heart' },
      { name: 'star-outline', label: 'Star' },
      { name: 'qr-code-outline', label: 'QR' },
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    icons: [
      { name: 'bus-outline', label: 'Bus' },
      { name: 'car-outline', label: 'Car' },
      { name: 'bicycle-outline', label: 'Bike' },
      { name: 'train-outline', label: 'Train' },
      { name: 'airplane-outline', label: 'Plane' },
      { name: 'boat-outline', label: 'Ship' },
    ],
  },
  {
    id: 'animals',
    label: 'Animals',
    icons: [
      { name: 'paw-outline', label: 'Pet' },
      { name: 'fish-outline', label: 'Fish' },
      { name: 'bug-outline', label: 'Bug' },
    ],
  },
  {
    id: 'food',
    label: 'Food',
    icons: [
      { name: 'cafe-outline', label: 'Coffee' },
      { name: 'pizza-outline', label: 'Pizza' },
      { name: 'restaurant-outline', label: 'Food' },
      { name: 'nutrition-outline', label: 'Apple' },
      { name: 'beer-outline', label: 'Drink' },
      { name: 'fast-food-outline', label: 'Burger' },
    ],
  },
  {
    id: 'tech',
    label: 'Tech / Media',
    icons: [
      { name: 'tv-outline', label: 'TV' },
      { name: 'laptop-outline', label: 'Computer' },
      { name: 'phone-portrait-outline', label: 'Mobile' },
      { name: 'camera-outline', label: 'Camera' },
      { name: 'headset-outline', label: 'Audio' },
      { name: 'game-controller-outline', label: 'Gaming' },
    ],
  },
];

export const QRCustomizer: React.FC<QRCustomizerProps> = ({ customization, onChange }) => {
  const { theme, isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState('general');

  // Check Contrast
  const isLowContrast = () => {
    const fg = customization.fgColor.toLowerCase();
    const bg = customization.bgColor.toLowerCase();
    if (fg === bg) return true;
    if (
      (fg === '#ffffff' && (bg === '#ffffff' || bg === '#f1f5f9' || bg === '#ecfdf5' || bg === '#eef2ff')) ||
      (bg === '#ffffff' && fg === '#ffffff') ||
      (fg === '#0f172a' && bg === '#000000') ||
      (fg === '#000000' && bg === '#0f172a')
    ) {
      return true;
    }
    return false;
  };

  const handleFgSelect = (color: string) => {
    triggerLightHaptic();
    onChange({ ...customization, fgColor: color });
  };

  const handleBgSelect = (color: string) => {
    triggerLightHaptic();
    onChange({ ...customization, bgColor: color });
  };

  const handleIconSelect = (iconName: string) => {
    triggerLightHaptic();
    if (customization.centerIcon === iconName) {
      // Toggle off
      onChange({
        ...customization,
        centerIcon: undefined,
        customLogoUri: undefined,
        errorCorrectionLevel: 'M',
      });
    } else {
      onChange({
        ...customization,
        centerIcon: iconName,
        customLogoUri: undefined,
        errorCorrectionLevel: 'H', // Force High error correction when icon is set
      });
    }
  };

  const handlePickCustomLogo = async () => {
    try {
      triggerLightHaptic();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const logoUri = result.assets[0].uri;
        onChange({
          ...customization,
          centerIcon: 'custom',
          customLogoUri: logoUri,
          errorCorrectionLevel: 'H',
        });
      }
    } catch (e) {
      Alert.alert('Selection Error', 'Failed to pick image logo.');
    }
  };

  const handleRemoveCustomLogo = () => {
    triggerLightHaptic();
    onChange({
      ...customization,
      centerIcon: undefined,
      customLogoUri: undefined,
      errorCorrectionLevel: 'M',
    });
  };

  const currentCategoryIcons =
    ICON_CATEGORIES.find((c) => c.id === activeCategory)?.icons || ICON_CATEGORIES[0].icons;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={[styles.headerIconBox, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="color-palette-outline" size={18} color={theme.primary} />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Customize QR Code</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Colors, center icons, and logos
          </Text>
        </View>
      </View>

      {/* Contrast Warning if needed */}
      {isLowContrast() && (
        <View style={[styles.warningBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: palette.rose[500] }]}>
          <Ionicons name="warning-outline" size={16} color={palette.rose[500]} style={{ marginRight: 6 }} />
          <Text style={[styles.warningText, { color: palette.rose[500] }]}>
            QR and background colors need more contrast for reliable scanning.
          </Text>
        </View>
      )}

      {/* 1. QR Foreground Color */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>QR Color (Foreground)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
          {FG_COLOR_PRESETS.map((item) => {
            const isSelected = customization.fgColor.toLowerCase() === item.color.toLowerCase();
            return (
              <Pressable
                key={item.color}
                onPress={() => handleFgSelect(item.color)}
                style={[
                  styles.colorChip,
                  {
                    backgroundColor: item.color,
                    borderColor: isSelected ? theme.primary : '#CBD5E1',
                    borderWidth: isSelected ? 3 : 1,
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={item.color === '#FFFFFF' ? '#000000' : '#FFFFFF'}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Background Color */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Background Color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
          {BG_COLOR_PRESETS.map((item) => {
            const isSelected = customization.bgColor.toLowerCase() === item.color.toLowerCase();
            return (
              <Pressable
                key={item.color}
                onPress={() => handleBgSelect(item.color)}
                style={[
                  styles.colorChip,
                  {
                    backgroundColor: item.color,
                    borderColor: isSelected ? theme.primary : '#CBD5E1',
                    borderWidth: isSelected ? 3 : 1,
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#059669"
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Center Icon / Logo */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Center Icon / Logo</Text>
          {customization.centerIcon && (
            <Pressable onPress={handleRemoveCustomLogo}>
              <Text style={[styles.clearLink, { color: palette.rose[500] }]}>Remove Icon</Text>
            </Pressable>
          )}
        </View>

        {/* Custom Logo Upload Box */}
        {customization.customLogoUri ? (
          <View style={[styles.customLogoPreviewBox, { borderColor: theme.border, backgroundColor: theme.surfaceVariant }]}>
            <Image source={{ uri: customization.customLogoUri }} style={styles.customLogoThumb} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[styles.customLogoText, { color: theme.text }]}>Custom Logo Active</Text>
              <Text style={[styles.customLogoSub, { color: theme.textSecondary }]}>High (H) error correction applied</Text>
            </View>
            <Pressable onPress={handleRemoveCustomLogo} style={styles.removeLogoBtn}>
              <Ionicons name="trash-outline" size={16} color={palette.rose[500]} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handlePickCustomLogo}
            style={({ pressed }) => [
              styles.uploadLogoBtn,
              { backgroundColor: theme.surfaceVariant, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="cloud-upload-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.uploadLogoBtnText, { color: theme.text }]}>Upload Custom Logo (PNG/JPG)</Text>
          </Pressable>
        )}

        {/* Icon Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catTabRow}>
          {ICON_CATEGORIES.map((cat) => {
            const isCatActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  triggerLightHaptic();
                  setActiveCategory(cat.id);
                }}
                style={[
                  styles.catTab,
                  {
                    backgroundColor: isCatActive ? theme.primary : 'transparent',
                    borderColor: isCatActive ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.catTabText,
                    {
                      color: isCatActive ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isCatActive ? '700' : '500',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Icon Grid */}
        <View style={styles.iconGrid}>
          {currentCategoryIcons.map((ic) => {
            const isSelected = customization.centerIcon === ic.name;
            return (
              <Pressable
                key={ic.name}
                onPress={() => handleIconSelect(ic.name)}
                style={({ pressed }) => [
                  styles.iconCell,
                  {
                    backgroundColor: isSelected ? theme.primaryLight : theme.surfaceVariant,
                    borderColor: isSelected ? theme.primary : theme.borderLight,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={ic.name as any}
                  size={20}
                  color={isSelected ? theme.primary : theme.text}
                />
                <Text
                  style={[
                    styles.iconCellLabel,
                    { color: isSelected ? theme.primary : theme.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {ic.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  warningText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  clearLink: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  colorRow: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  colorChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  uploadLogoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  uploadLogoBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  customLogoPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  customLogoThumb: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
  },
  customLogoText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  customLogoSub: {
    fontSize: 10,
    marginTop: 2,
  },
  removeLogoBtn: {
    padding: spacing.xs,
  },
  catTabRow: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  catTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  catTabText: {
    fontSize: typography.fontSize.xs,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  iconCell: {
    width: '23%',
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCellLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeight.medium,
    marginTop: 4,
    textAlign: 'center',
  },
});
