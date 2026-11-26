import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  { id: 'style', label: 'Shape', icon: 'shapes-outline' },
  { id: 'advanced', label: 'Options', icon: 'options-outline' },
];

const QUICK_THEMES: {
  id: QRThemeId;
  name: string;
  fg: string;
  bg: string;
}[] = [
  { id: 'classic', name: 'Classic', fg: '#000000', bg: '#FFFFFF' },
  { id: 'green', name: 'Emerald', fg: '#059669', bg: '#FFFFFF' },
  { id: 'ocean', name: 'Ocean', fg: '#0284C7', bg: '#FFFFFF' },
  { id: 'purple', name: 'Violet', fg: '#7C3AED', bg: '#FFFFFF' },
  { id: 'dark', name: 'Night', fg: '#38BDF8', bg: '#0F172A' },
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
  { name: 'White', color: '#FFFFFF' },
  { name: 'Soft Grey', color: '#F8FAFC' },
  { name: 'Mint', color: '#F0FDF4' },
  { name: 'Sky', color: '#F0F9FF' },
  { name: 'Lavender', color: '#FAF5FF' },
  { name: 'Warm', color: '#FFFBEB' },
  { name: 'Dark', color: '#0F172A' },
];

const CENTER_ICONS: { name: string; label: string }[] = [
  { name: 'globe-outline', label: 'Web' },
  { name: 'link-outline', label: 'Link' },
  { name: 'wifi-outline', label: 'Wi-Fi' },
  { name: 'call-outline', label: 'Phone' },
  { name: 'mail-outline', label: 'Email' },
  { name: 'location-outline', label: 'Map' },
  { name: 'image-outline', label: 'Photo' },
  { name: 'videocam-outline', label: 'Video' },
  { name: 'musical-notes-outline', label: 'Audio' },
  { name: 'document-text-outline', label: 'PDF' },
  { name: 'person-outline', label: 'Contact' },
  { name: 'cart-outline', label: 'Store' },
  { name: 'card-outline', label: 'Pay' },
  { name: 'star-outline', label: 'Star' },
  { name: 'qr-code-outline', label: 'QR' },
];

const PATTERN_OPTIONS: { id: QRPattern; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'square', label: 'Square', icon: 'grid-outline' },
  { id: 'rounded', label: 'Rounded', icon: 'apps-outline' },
  { id: 'dots', label: 'Dots', icon: 'ellipsis-horizontal-circle-outline' },
];

const CORNER_OPTIONS: { id: QRCornerStyle; label: string; radius: number }[] = [
  { id: 'classic', label: 'Sharp', radius: 2 },
  { id: 'soft', label: 'Soft', radius: 6 },
  { id: 'rounded', label: 'Round', radius: 11 },
];

const FRAME_OPTIONS: { id: QRFrame; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'none', label: 'No Frame', icon: 'remove-circle-outline' },
  { id: 'simple', label: 'Outline', icon: 'square-outline' },
  { id: 'rounded', label: 'Card', icon: 'tablet-portrait-outline' },
  { id: 'scan_me', label: 'Scan Me', icon: 'scan-outline' },
];

export const QRCustomizer: React.FC<QRCustomizerProps> = ({
  customization,
  onChange,
  isPhotoType = false,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('colors');
  const [colorPickerTarget, setColorPickerTarget] = useState<'fg' | 'bg' | null>(null);

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

  const handleSelectTheme = (themeItem: (typeof QUICK_THEMES)[0]) => {
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
    if (customization.centerIcon === iconName && !customization.customLogoUri) {
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

  const hasAnyLogo = Boolean(customization.centerIcon || customization.customLogoUri);

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}>
      {/* Clean Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: '#0F172A' }]}>Customize Style</Text>
        <Pressable
          onPress={handleReset}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.resetBtn,
            { backgroundColor: '#F1F5F9', opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="refresh-outline" size={14} color="#475569" />
          <Text style={styles.resetBtnText}>Reset</Text>
        </Pressable>
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => {
                triggerLightHaptic();
                setActiveTab(tab.id);
              }}
              style={[styles.tabItem, isActive && styles.activeTabItem]}
            >
              <Ionicons
                name={tab.icon}
                size={15}
                color={isActive ? '#059669' : '#64748B'}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? '#059669' : '#64748B' },
                  isActive && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* TAB 1: COLORS */}
      {activeTab === 'colors' && (
        <View style={styles.tabContent}>
          {/* Quick Presets (Even 5-column row, zero clipping) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Presets</Text>
            <View style={styles.themesGrid}>
              {QUICK_THEMES.map((t) => {
                const isSelected =
                  customization.fgColor.toLowerCase() === t.fg.toLowerCase() &&
                  customization.bgColor.toLowerCase() === t.bg.toLowerCase();
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => handleSelectTheme(t)}
                    style={[
                      styles.themeChip,
                      {
                        backgroundColor: isSelected ? '#ECFDF5' : '#F8FAFC',
                        borderColor: isSelected ? '#059669' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.themeSwatchPreview,
                        { backgroundColor: t.bg, borderColor: '#CBD5E1' },
                      ]}
                    >
                      <View style={[styles.themeInnerDot, { backgroundColor: t.fg }]} />
                    </View>
                    <Text
                      style={[
                        styles.themeName,
                        { color: isSelected ? '#059669' : '#334155' },
                      ]}
                      numberOfLines={1}
                    >
                      {t.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* QR Color (Wrapped cleanly inside card) */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>QR Color</Text>
              <Pressable
                onPress={() => {
                  triggerLightHaptic();
                  setColorPickerTarget('fg');
                }}
                style={[
                  styles.customPillBtn,
                  {
                    borderColor: isCustomFg ? '#059669' : '#E2E8F0',
                    backgroundColor: isCustomFg ? '#ECFDF5' : '#F8FAFC',
                  },
                ]}
              >
                <View style={[styles.miniColorDot, { backgroundColor: customization.fgColor }]} />
                <Text style={[styles.customPillText, { color: isCustomFg ? '#059669' : '#334155' }]}>
                  Custom
                </Text>
              </Pressable>
            </View>

            <View style={styles.swatchWrapRow}>
              {FG_COLOR_PRESETS.map((item) => {
                const isSelected = customization.fgColor.toLowerCase() === item.color.toLowerCase();
                return (
                  <Pressable
                    key={item.color}
                    onPress={() => handleFgSelect(item.color)}
                    style={[
                      styles.swatchOuter,
                      isSelected && { borderColor: '#059669', backgroundColor: '#ECFDF5' },
                    ]}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: item.color }]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Background Color */}
          <View style={[styles.section, { marginBottom: contrastCheck.isValid ? 0 : spacing.sm }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Background</Text>
              <Pressable
                onPress={() => {
                  triggerLightHaptic();
                  setColorPickerTarget('bg');
                }}
                style={[
                  styles.customPillBtn,
                  {
                    borderColor: isCustomBg ? '#059669' : '#E2E8F0',
                    backgroundColor: isCustomBg ? '#ECFDF5' : '#F8FAFC',
                  },
                ]}
              >
                <View
                  style={[
                    styles.miniColorDot,
                    { backgroundColor: customization.bgColor, borderWidth: 1, borderColor: '#CBD5E1' },
                  ]}
                />
                <Text style={[styles.customPillText, { color: isCustomBg ? '#059669' : '#334155' }]}>
                  Custom
                </Text>
              </Pressable>
            </View>

            <View style={styles.swatchWrapRow}>
              {BG_COLOR_PRESETS.map((item) => {
                const isSelected = customization.bgColor.toLowerCase() === item.color.toLowerCase();
                const isDarkBg = item.color === '#0F172A' || item.color === '#000000';
                return (
                  <Pressable
                    key={item.color}
                    onPress={() => handleBgSelect(item.color)}
                    style={[
                      styles.swatchOuter,
                      isSelected && { borderColor: '#059669', backgroundColor: '#ECFDF5' },
                    ]}
                  >
                    <View
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: item.color,
                          borderWidth: 1,
                          borderColor: '#CBD5E1',
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={isDarkBg ? '#FFFFFF' : '#059669'}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Only show alert if contrast is too low */}
          {!contrastCheck.isValid && (
            <View style={styles.lowContrastBanner}>
              <Ionicons name="warning-outline" size={16} color={palette.rose[600]} />
              <Text style={styles.lowContrastText}>
                Low contrast — choose darker QR or lighter background for reliable scanning.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* TAB 2: LOGO */}
      {activeTab === 'logo' && (
        <View style={styles.tabContent}>
          <View style={styles.logoTopActions}>
            <Pressable
              onPress={handlePickCustomLogo}
              style={({ pressed }) => [
                styles.uploadLogoBtn,
                {
                  backgroundColor: customization.customLogoUri ? '#ECFDF5' : '#F8FAFC',
                  borderColor: customization.customLogoUri ? '#059669' : '#E2E8F0',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              {customization.customLogoUri ? (
                <Image source={{ uri: customization.customLogoUri }} style={styles.uploadedLogoMini} />
              ) : (
                <View style={styles.uploadLogoIconCircle}>
                  <Ionicons name="image-outline" size={18} color="#059669" />
                </View>
              )}
              <Text style={styles.uploadLogoText}>
                {customization.customLogoUri ? 'Change Custom Logo' : 'Upload Logo from Gallery'}
              </Text>
            </Pressable>

            {hasAnyLogo && (
              <Pressable
                onPress={handleRemoveLogo}
                style={({ pressed }) => [
                  styles.clearLogoBtn,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <Ionicons name="close-circle-outline" size={18} color={palette.rose[500]} />
                <Text style={styles.clearLogoText}>Clear</Text>
              </Pressable>
            )}
          </View>

          <Text style={[styles.sectionTitle, { marginBottom: spacing.xs + 2 }]}>Center Icons</Text>
          <View style={styles.iconGrid}>
            {CENTER_ICONS.map((item) => {
              const isSelected =
                customization.centerIcon === item.name && !customization.customLogoUri;
              return (
                <Pressable
                  key={item.name}
                  onPress={() => handleIconSelect(item.name)}
                  style={[
                    styles.iconTile,
                    {
                      backgroundColor: isSelected ? '#ECFDF5' : '#F8FAFC',
                      borderColor: isSelected ? '#059669' : '#E2E8F0',
                    },
                  ]}
                >
                  <Ionicons
                    name={item.name as any}
                    size={20}
                    color={isSelected ? '#059669' : '#334155'}
                  />
                  <Text
                    style={[
                      styles.iconTileLabel,
                      { color: isSelected ? '#059669' : '#64748B' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* TAB 3: SHAPE */}
      {activeTab === 'style' && (
        <View style={styles.tabContent}>
          {/* Pattern */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pattern</Text>
            <View style={styles.threeColRow}>
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
                      styles.cleanOptionCard,
                      {
                        backgroundColor: isSelected ? '#ECFDF5' : '#F8FAFC',
                        borderColor: isSelected ? '#059669' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={isSelected ? '#059669' : '#334155'}
                    />
                    <Text
                      style={[
                        styles.cleanOptionLabel,
                        { color: isSelected ? '#059669' : '#0F172A' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Corners */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Corners</Text>
            <View style={styles.threeColRow}>
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
                      styles.cleanOptionCard,
                      {
                        backgroundColor: isSelected ? '#ECFDF5' : '#F8FAFC',
                        borderColor: isSelected ? '#059669' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.cornerVisualBox,
                        {
                          borderRadius: opt.radius,
                          borderColor: isSelected ? '#059669' : '#334155',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.cleanOptionLabel,
                        { color: isSelected ? '#059669' : '#0F172A' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Frame (2x2 Grid so labels never truncate) */}
          <View style={[styles.section, { marginBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Frame</Text>
            <View style={styles.twoByTwoGrid}>
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
                      styles.frameOptionBtn,
                      {
                        backgroundColor: isSelected ? '#ECFDF5' : '#F8FAFC',
                        borderColor: isSelected ? '#059669' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={17}
                      color={isSelected ? '#059669' : '#475569'}
                    />
                    <Text
                      style={[
                        styles.cleanOptionLabel,
                        { color: isSelected ? '#059669' : '#0F172A', marginTop: 0 },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* TAB 4: OPTIONS */}
      {activeTab === 'advanced' && (
        <View style={styles.tabContent}>
          {/* Resolution */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolution</Text>
            <View style={styles.threeColRow}>
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
                      styles.pillOptionBtn,
                      {
                        backgroundColor: isSelected ? '#059669' : '#F8FAFC',
                        borderColor: isSelected ? '#059669' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillOptionTitle,
                        { color: isSelected ? '#FFFFFF' : '#0F172A' },
                      ]}
                    >
                      {res} px
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Error Recovery */}
          <View style={[styles.section, { marginBottom: isPhotoType ? spacing.md : 0 }]}>
            <Text style={styles.sectionTitle}>Scan Recovery</Text>
            <View style={styles.threeColRow}>
              {(
                [
                  { level: 'L', pct: '7%' },
                  { level: 'M', pct: '15%' },
                  { level: 'Q', pct: '25%' },
                  { level: 'H', pct: '30%' },
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
                      styles.pillOptionBtn,
                      {
                        backgroundColor: isSelected ? '#ECFDF5' : '#F8FAFC',
                        borderColor: isSelected ? '#059669' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillOptionTitle,
                        { color: isSelected ? '#059669' : '#0F172A' },
                      ]}
                    >
                      {item.level} · {item.pct}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Photo Quality */}
          {isPhotoType && (
            <View style={[styles.section, { marginBottom: 0 }]}>
              <Text style={styles.sectionTitle}>Image Quality</Text>
              <View style={styles.threeColRow}>
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
                        styles.pillOptionBtn,
                        {
                          backgroundColor: isSelected ? '#059669' : '#F8FAFC',
                          borderColor: isSelected ? '#059669' : '#E2E8F0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillOptionTitle,
                          { color: isSelected ? '#FFFFFF' : '#0F172A' },
                        ]}
                      >
                        {q === 'optimized' ? 'Optimized' : 'Original'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Color Picker Modal */}
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
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.md,
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 11,
    gap: 4,
  },
  activeTabItem: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
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
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  themesGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  themeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  themeSwatchPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  themeInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeName: {
    fontSize: 11,
    fontWeight: '600',
  },
  customPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: 6,
    marginBottom: 4,
  },
  miniColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  customPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  swatchWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatchOuter: {
    padding: 2,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowContrastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.rose[50],
    borderColor: palette.rose[200],
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  lowContrastText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: palette.rose[700],
    lineHeight: 15,
  },
  logoTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  uploadLogoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  uploadLogoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedLogoMini: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  uploadLogoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  clearLogoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: palette.rose[50],
    borderWidth: 1,
    borderColor: palette.rose[200],
    gap: 4,
  },
  clearLogoText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.rose[600],
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconTile: {
    width: '18%',
    flexGrow: 1,
    minWidth: 54,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconTileLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  threeColRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cleanOptionCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cleanOptionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  cornerVisualBox: {
    width: 20,
    height: 20,
    borderWidth: 2.5,
  },
  twoByTwoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frameOptionBtn: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  pillOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
});
