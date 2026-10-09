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
import {
  QRCustomization,
  QRPattern,
  QRCornerStyle,
  QRFrame,
  QRThemeId,
  PhotoQuality,
  QRExportSize,
} from '../types/qr';
import { QRGeneratorService } from '../services/qrGenerator';
import { ColorPickerModal } from './ColorPickerModal';
import { triggerLightHaptic } from '../utils/feedback';

interface QRCustomizerProps {
  customization: QRCustomization;
  onChange: (customization: QRCustomization) => void;
  isPhotoType?: boolean;
}

type TabKey = 'colors' | 'logo' | 'style' | 'advanced';

const TABS: { id: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'colors', label: 'Colors', icon: 'color-palette-outline' },
  { id: 'logo', label: 'Logo', icon: 'image-outline' },
  { id: 'style', label: 'Style', icon: 'shapes-outline' },
  { id: 'advanced', label: 'Advanced', icon: 'options-outline' },
];

const QUICK_THEMES = [
  {
    id: 'classic' as QRThemeId,
    name: 'Classic',
    fg: '#000000',
    bg: '#FFFFFF',
    desc: 'Black & White',
  },
  {
    id: 'green' as QRThemeId,
    name: 'Green',
    fg: '#059669',
    bg: '#FFFFFF',
    desc: 'Emerald Modern',
  },
  {
    id: 'ocean' as QRThemeId,
    name: 'Ocean',
    fg: '#0284C7',
    bg: '#FFFFFF',
    desc: 'Sky Blue',
  },
  {
    id: 'purple' as QRThemeId,
    name: 'Purple',
    fg: '#7C3AED',
    bg: '#FFFFFF',
    desc: 'Royal Violet',
  },
  {
    id: 'dark' as QRThemeId,
    name: 'Dark',
    fg: '#38BDF8',
    bg: '#0F172A',
    desc: 'Slate Night',
  },
];

const FG_COLOR_PRESETS = [
  { name: 'Black', color: '#000000' },
  { name: 'Slate', color: '#0F172A' },
  { name: 'Emerald', color: '#059669' },
  { name: 'Ocean', color: '#0284C7' },
  { name: 'Indigo', color: '#4F46E5' },
  { name: 'Purple', color: '#7C3AED' },
  { name: 'Rose', color: '#E11D48' },
  { name: 'Amber', color: '#D97706' },
];

const BG_COLOR_PRESETS = [
  { name: 'Pure White', color: '#FFFFFF' },
  { name: 'Slate Tint', color: '#F8FAFC' },
  { name: 'Green Tint', color: '#F0FDF4' },
  { name: 'Sky Tint', color: '#F0F9FF' },
  { name: 'Purple Tint', color: '#FAF5FF' },
  { name: 'Warm Amber', color: '#FFFBEB' },
  { name: 'Dark Slate', color: '#0F172A' },
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
  {
    id: 'business',
    label: 'Business',
    icons: [
      { name: 'briefcase-outline', label: 'Work' },
      { name: 'card-outline', label: 'Payment' },
      { name: 'receipt-outline', label: 'Invoice' },
      { name: 'shield-checkmark-outline', label: 'Secure' },
      { name: 'barcode-outline', label: 'Barcode' },
      { name: 'people-outline', label: 'Team' },
    ],
  },
];

const PATTERN_OPTIONS: { id: QRPattern; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'square', label: 'Square', desc: 'Classic crisp standard QR modules', icon: 'grid-outline' },
  { id: 'rounded', label: 'Rounded', desc: 'Soft smooth rounded modules', icon: 'apps-outline' },
  { id: 'dots', label: 'Dots', desc: 'Modern circular dotted style', icon: 'ellipse-outline' },
];

const CORNER_OPTIONS: { id: QRCornerStyle; label: string; desc: string }[] = [
  { id: 'classic', label: 'Classic', desc: 'Standard sharp corners' },
  { id: 'rounded', label: 'Rounded', desc: 'Smooth rounded corners' },
  { id: 'soft', label: 'Soft', desc: 'Subtle curved corners' },
];

const FRAME_OPTIONS: { id: QRFrame; label: string; desc: string }[] = [
  { id: 'none', label: 'None', desc: 'Standard borderless QR' },
  { id: 'simple', label: 'Simple', desc: 'Crisp framed outline' },
  { id: 'rounded', label: 'Rounded', desc: 'Card border frame' },
  { id: 'scan_me', label: 'Scan Me', desc: 'Top "SCAN ME" banner' },
];

export const QRCustomizer: React.FC<QRCustomizerProps> = ({
  customization,
  onChange,
  isPhotoType = false,
}) => {
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('colors');
  const [activeCategory, setActiveCategory] = useState('general');

  // Full Color Picker Modal State ('fg' | 'bg' | null)
  const [colorPickerTarget, setColorPickerTarget] = useState<'fg' | 'bg' | null>(null);

  // Check Contrast
  const contrastCheck = QRGeneratorService.checkContrast(
    customization.fgColor,
    customization.bgColor
  );

  const handleReset = () => {
    triggerLightHaptic();
    onChange({
      fgColor: '#000000',
      bgColor: '#FFFFFF',
      size: 220,
      errorCorrectionLevel: 'M',
      pattern: 'square',
      cornerStyle: 'classic',
      frame: 'none',
      themeId: 'classic',
      photoQuality: 'optimized',
      exportSize: 512,
      centerIcon: undefined,
      customLogoUri: undefined,
    });
  };

  const handleSelectTheme = (themeItem: typeof QUICK_THEMES[0]) => {
    triggerLightHaptic();
    onChange({
      ...customization,
      fgColor: themeItem.fg,
      bgColor: themeItem.bg,
      themeId: themeItem.id,
    });
  };

  const handleFgSelect = (color: string) => {
    triggerLightHaptic();
    onChange({ ...customization, fgColor: color, themeId: 'custom' });
  };

  const handleBgSelect = (color: string) => {
    triggerLightHaptic();
    onChange({ ...customization, bgColor: color, themeId: 'custom' });
  };

  const handleIconSelect = (iconName: string) => {
    triggerLightHaptic();
    if (customization.centerIcon === iconName) {
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
        errorCorrectionLevel: 'H',
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
        quality: 0.85,
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
    } catch {
      Alert.alert('Selection Error', 'Failed to pick image logo.');
    }
  };

  const handleRemoveLogo = () => {
    triggerLightHaptic();
    onChange({
      ...customization,
      centerIcon: undefined,
      customLogoUri: undefined,
      errorCorrectionLevel: 'M',
    });
  };

  const isCustomFg = !FG_COLOR_PRESETS.some(
    (p) => p.color.toLowerCase() === customization.fgColor.toLowerCase()
  );

  const isCustomBg = !BG_COLOR_PRESETS.some(
    (p) => p.color.toLowerCase() === customization.bgColor.toLowerCase()
  );

  const currentCategoryIcons =
    ICON_CATEGORIES.find((c) => c.id === activeCategory)?.icons || ICON_CATEGORIES[0].icons;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Header with Title and Reset Style Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconBox, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="color-palette-outline" size={18} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Customize QR</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Colors, style, logo, & resolution
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            styles.resetBtn,
            { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="refresh-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
          <Text style={[styles.resetBtnText, { color: theme.textSecondary }]}>Reset Style</Text>
        </Pressable>
      </View>

      {/* 4 Clean Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.surfaceVariant, borderColor: theme.borderLight }]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => {
                triggerLightHaptic();
                setActiveTab(tab.id);
              }}
              style={[
                styles.tabItem,
                isActive && [styles.activeTabItem, { backgroundColor: theme.surface }],
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? theme.primary : theme.textMuted}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? theme.primary : theme.textMuted },
                  isActive && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: COLORS */}
      {/* ========================================================================= */}
      {activeTab === 'colors' && (
        <View style={styles.tabContent}>
          {/* Quick Themes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Themes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowList}>
              {QUICK_THEMES.map((t) => {
                const isSelected =
                  customization.fgColor.toLowerCase() === t.fg.toLowerCase() &&
                  customization.bgColor.toLowerCase() === t.bg.toLowerCase();
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => handleSelectTheme(t)}
                    style={[
                      styles.themeCard,
                      {
                        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                        borderColor: isSelected ? theme.primary : theme.borderLight,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={styles.themeColorPair}>
                      <View style={[styles.themeColorDot, { backgroundColor: t.fg }]} />
                      <View style={[styles.themeColorDot, { backgroundColor: t.bg, borderWidth: 1, borderColor: '#cbd5e1' }]} />
                    </View>
                    <Text style={[styles.themeName, { color: theme.text }]}>{t.name}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={14} color={theme.primary} style={styles.themeCheck} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* QR Foreground Color */}
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

              {/* Visual Color Spectrum Custom Button */}
              <Pressable
                onPress={() => {
                  triggerLightHaptic();
                  setColorPickerTarget('fg');
                }}
                style={[
                  styles.customSpectrumChip,
                  {
                    borderColor: isCustomFg ? theme.primary : theme.border,
                    borderWidth: isCustomFg ? 2.5 : 1,
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  },
                ]}
              >
                <Ionicons
                  name="color-palette"
                  size={16}
                  color={isCustomFg ? theme.primary : theme.text}
                />
                <Text style={[styles.customChipText, { color: isCustomFg ? theme.primary : theme.text }]}>
                  Custom
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* QR Background Color */}
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
                        color={item.color === '#0F172A' || item.color === '#000000' ? '#FFFFFF' : '#059669'}
                      />
                    )}
                  </Pressable>
                );
              })}

              {/* Visual Color Spectrum Custom Button */}
              <Pressable
                onPress={() => {
                  triggerLightHaptic();
                  setColorPickerTarget('bg');
                }}
                style={[
                  styles.customSpectrumChip,
                  {
                    borderColor: isCustomBg ? theme.primary : theme.border,
                    borderWidth: isCustomBg ? 2.5 : 1,
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  },
                ]}
              >
                <Ionicons
                  name="color-palette"
                  size={16}
                  color={isCustomBg ? theme.primary : theme.text}
                />
                <Text style={[styles.customChipText, { color: isCustomBg ? theme.primary : theme.text }]}>
                  Custom
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Contrast Status Card */}
          <View
            style={[
              styles.contrastCard,
              {
                backgroundColor: contrastCheck.isValid
                  ? isDark
                    ? 'rgba(16, 185, 129, 0.12)'
                    : palette.emerald[50]
                  : isDark
                  ? 'rgba(239, 68, 68, 0.12)'
                  : palette.rose[50],
                borderColor: contrastCheck.isValid ? palette.emerald[500] : palette.rose[500],
              },
            ]}
          >
            <Ionicons
              name={contrastCheck.isValid ? 'checkmark-circle' : 'warning'}
              size={18}
              color={contrastCheck.isValid ? palette.emerald[600] : palette.rose[500]}
              style={{ marginRight: 8 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.contrastTitle,
                  { color: contrastCheck.isValid ? palette.emerald[700] : palette.rose[600] },
                ]}
              >
                {contrastCheck.isValid ? 'High Contrast' : 'Low Contrast Warning'}
              </Text>
              <Text
                style={[
                  styles.contrastDesc,
                  { color: contrastCheck.isValid ? palette.emerald[800] : palette.rose[700] },
                ]}
              >
                {contrastCheck.isValid
                  ? 'Optimal color contrast for rapid camera scanning.'
                  : 'QR and background colors need more contrast for reliable scanning.'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LOGO */}
      {/* ========================================================================= */}
      {activeTab === 'logo' && (
        <View style={styles.tabContent}>
          {/* Logo Action Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Center Logo</Text>
            <View style={styles.logoActionRow}>
              <Pressable
                onPress={handleRemoveLogo}
                style={[
                  styles.logoChoiceBtn,
                  {
                    backgroundColor: !customization.centerIcon && !customization.customLogoUri ? theme.primary : theme.surfaceVariant,
                    borderColor: !customization.centerIcon && !customization.customLogoUri ? theme.primary : theme.border,
                  },
                ]}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={!customization.centerIcon && !customization.customLogoUri ? '#FFFFFF' : theme.text}
                />
                <Text
                  style={[
                    styles.logoChoiceText,
                    { color: !customization.centerIcon && !customization.customLogoUri ? '#FFFFFF' : theme.text },
                  ]}
                >
                  No Logo
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePickCustomLogo}
                style={[
                  styles.logoChoiceBtn,
                  {
                    backgroundColor: customization.customLogoUri ? theme.primary : theme.surfaceVariant,
                    borderColor: customization.customLogoUri ? theme.primary : theme.border,
                  },
                ]}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={18}
                  color={customization.customLogoUri ? '#FFFFFF' : theme.text}
                />
                <Text
                  style={[
                    styles.logoChoiceText,
                    { color: customization.customLogoUri ? '#FFFFFF' : theme.text },
                  ]}
                >
                  Upload Logo
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Uploaded Custom Logo Preview if present */}
          {customization.customLogoUri && (
            <View style={[styles.customLogoPreviewBox, { borderColor: theme.border, backgroundColor: theme.surfaceVariant }]}>
              <Image source={{ uri: customization.customLogoUri }} style={styles.customLogoThumb} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[styles.customLogoTitle, { color: theme.text }]}>Custom Logo Selected</Text>
                <Text style={[styles.customLogoSub, { color: theme.textSecondary }]}>
                  High Error Correction (30%) active
                </Text>
              </View>
              <Pressable onPress={handleRemoveLogo} style={styles.removeLogoBtn}>
                <Ionicons name="trash-outline" size={16} color={palette.rose[500]} />
              </Pressable>
            </View>
          )}

          {/* Category Pills for Built-in Center Icons */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular Center Icons</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsRow}>
              {ICON_CATEGORIES.map((category) => {
                const isSelected = activeCategory === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      triggerLightHaptic();
                      setActiveCategory(category.id);
                    }}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surfaceVariant,
                        borderColor: isSelected ? theme.primary : theme.borderLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Icons Grid */}
            <View style={styles.iconGrid}>
              {currentCategoryIcons.map((item) => {
                const isSelected = customization.centerIcon === item.name && !customization.customLogoUri;
                return (
                  <Pressable
                    key={item.name}
                    onPress={() => handleIconSelect(item.name)}
                    style={[
                      styles.iconGridItem,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.surfaceVariant,
                        borderColor: isSelected ? theme.primary : theme.borderLight,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.name as any}
                      size={22}
                      color={isSelected ? theme.primary : theme.text}
                    />
                    <Text
                      style={[
                        styles.iconLabel,
                        { color: isSelected ? theme.primary : theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.iconCheckBadge, { backgroundColor: theme.primary }]}>
                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Informational Helper */}
          <View style={[styles.infoNoteBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.borderLight }]}>
            <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} style={{ marginRight: 6 }} />
            <Text style={[styles.infoNoteText, { color: theme.textSecondary }]}>
              Center logos automatically use High Error Correction Level (30%) so scanners read your QR reliably.
            </Text>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STYLE */}
      {/* ========================================================================= */}
      {activeTab === 'style' && (
        <View style={styles.tabContent}>
          {/* QR Pattern / Module Style */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>QR Pattern (Module Style)</Text>
            <View style={styles.styleOptionsGrid}>
              {PATTERN_OPTIONS.map((opt) => {
                const isSelected = (customization.pattern || 'square') === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      triggerLightHaptic();
                      onChange({ ...customization, pattern: opt.id });
                    }}
                    style={[
                      styles.styleOptionCard,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.surfaceVariant,
                        borderColor: isSelected ? theme.primary : theme.borderLight,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={isSelected ? theme.primary : theme.text}
                      style={{ marginBottom: 4 }}
                    />
                    <Text style={[styles.styleOptionTitle, { color: isSelected ? theme.primary : theme.text }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.styleOptionDesc, { color: theme.textMuted }]} numberOfLines={1}>
                      {opt.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Corner Style */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Corner Finder Style</Text>
            <View style={styles.styleOptionsGrid}>
              {CORNER_OPTIONS.map((opt) => {
                const isSelected = (customization.cornerStyle || 'classic') === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      triggerLightHaptic();
                      onChange({ ...customization, cornerStyle: opt.id });
                    }}
                    style={[
                      styles.styleOptionCard,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.surfaceVariant,
                        borderColor: isSelected ? theme.primary : theme.borderLight,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.styleOptionTitle, { color: isSelected ? theme.primary : theme.text }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.styleOptionDesc, { color: theme.textMuted }]} numberOfLines={1}>
                      {opt.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Frame Style */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Frame & Border</Text>
            <View style={styles.styleOptionsGrid}>
              {FRAME_OPTIONS.map((opt) => {
                const isSelected = (customization.frame || 'none') === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      triggerLightHaptic();
                      onChange({ ...customization, frame: opt.id });
                    }}
                    style={[
                      styles.styleOptionCard,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.surfaceVariant,
                        borderColor: isSelected ? theme.primary : theme.borderLight,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.styleOptionTitle, { color: isSelected ? theme.primary : theme.text }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.styleOptionDesc, { color: theme.textMuted }]} numberOfLines={1}>
                      {opt.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ADVANCED */}
      {/* ========================================================================= */}
      {activeTab === 'advanced' && (
        <View style={styles.tabContent}>
          {/* Error Correction Level */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Error Correction Level</Text>
            <View style={styles.eclRow}>
              {(
                [
                  { level: 'L', name: 'Low (7%)', desc: 'Compact size' },
                  { level: 'M', name: 'Medium (15%)', desc: 'Recommended' },
                  { level: 'Q', name: 'Quartile (25%)', desc: 'Robust' },
                  { level: 'H', name: 'High (30%)', desc: 'Logos & outdoor' },
                ] as const
              ).map((item) => {
                const isSelected = customization.errorCorrectionLevel === item.level;
                return (
                  <Pressable
                    key={item.level}
                    onPress={() => {
                      triggerLightHaptic();
                      onChange({ ...customization, errorCorrectionLevel: item.level });
                    }}
                    style={[
                      styles.eclCard,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.surfaceVariant,
                        borderColor: isSelected ? theme.primary : theme.borderLight,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.eclLevelText, { color: isSelected ? theme.primary : theme.text }]}>
                      {item.level}
                    </Text>
                    <Text style={[styles.eclNameText, { color: isSelected ? theme.primary : theme.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.eclDescText, { color: theme.textMuted }]}>
                      {item.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Export Resolution */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>QR Export Resolution</Text>
            <View style={styles.choiceButtonsRow}>
              {([512, 1024, 2048] as QRExportSize[]).map((res) => {
                const isSelected = (customization.exportSize || 512) === res;
                return (
                  <Pressable
                    key={res}
                    onPress={() => {
                      triggerLightHaptic();
                      onChange({ ...customization, exportSize: res });
                    }}
                    style={[
                      styles.choiceBtn,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surfaceVariant,
                        borderColor: isSelected ? theme.primary : theme.borderLight,
                      },
                    ]}
                  >
                    <Text style={[styles.choiceBtnText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                      {res} px {res === 512 ? '(Std)' : res === 1024 ? '(HD)' : '(Ultra)'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Quiet Zone Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quiet Zone Margin</Text>
            <View style={[styles.quietZoneBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.borderLight }]}>
              <Ionicons name="shield-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.quietZoneTitle, { color: theme.text }]}>Standard 4 Modules</Text>
                <Text style={[styles.quietZoneSub, { color: theme.textSecondary }]}>
                  ISO/IEC 18004 compliant margin for 100% scanner decodability.
                </Text>
              </View>
            </View>
          </View>

          {/* Photo Quality (if photo type) */}
          {isPhotoType && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Photo Upload Quality</Text>
              <View style={styles.choiceButtonsRow}>
                {(['optimized', 'original'] as PhotoQuality[]).map((q) => {
                  const isSelected = (customization.photoQuality || 'optimized') === q;
                  return (
                    <Pressable
                      key={q}
                      onPress={() => {
                        triggerLightHaptic();
                        onChange({ ...customization, photoQuality: q });
                      }}
                      style={[
                        styles.choiceBtn,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.surfaceVariant,
                          borderColor: isSelected ? theme.primary : theme.borderLight,
                        },
                      ]}
                    >
                      <Text style={[styles.choiceBtnText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                        {q === 'optimized' ? 'Optimized (Fast)' : 'Original (High Res)'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Visual Color Picker Modal */}
      <ColorPickerModal
        visible={colorPickerTarget !== null}
        title={colorPickerTarget === 'fg' ? 'Pick QR Color' : 'Pick Background Color'}
        currentColor={colorPickerTarget === 'fg' ? customization.fgColor : customization.bgColor}
        contrastAgainstColor={colorPickerTarget === 'fg' ? customization.bgColor : customization.fgColor}
        onSelectColor={(hex) => {
          if (colorPickerTarget === 'fg') {
            onChange({ ...customization, fgColor: hex, themeId: 'custom' });
          } else if (colorPickerTarget === 'bg') {
            onChange({ ...customization, bgColor: hex, themeId: 'custom' });
          }
        }}
        onClose={() => setColorPickerTarget(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBox: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: 3,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: borderRadius.md,
  },
  activeTabItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '700',
  },
  tabContent: {
    paddingTop: 2,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  rowList: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  themeCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 72,
    position: 'relative',
  },
  themeColorPair: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 2,
  },
  themeColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeName: {
    fontSize: 11,
    fontWeight: '600',
  },
  themeCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  colorRow: {
    gap: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  colorChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSpectrumChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    gap: 4,
  },
  customChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contrastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: 2,
  },
  contrastTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  contrastDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  logoActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  logoChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: 6,
  },
  logoChoiceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customLogoPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  customLogoThumb: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  customLogoTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  customLogoSub: {
    fontSize: 11,
    marginTop: 1,
  },
  removeLogoBtn: {
    padding: 6,
  },
  categoryPillsRow: {
    gap: 6,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconGridItem: {
    width: '22.5%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 4,
  },
  iconLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  iconCheckBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  styleOptionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  styleOptionCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  styleOptionDesc: {
    fontSize: 9,
    textAlign: 'center',
  },
  eclRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  eclCard: {
    width: '48%',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  eclLevelText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  eclNameText: {
    fontSize: 11,
    fontWeight: '700',
  },
  eclDescText: {
    fontSize: 10,
    marginTop: 1,
  },
  choiceButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quietZoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  quietZoneTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  quietZoneSub: {
    fontSize: 11,
    marginTop: 1,
  },
});
