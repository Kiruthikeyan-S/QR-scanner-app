import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius, spacing } from '../theme/typography';
import { QRGeneratorService } from '../services/qrGenerator';
import { triggerLightHaptic } from '../utils/feedback';

interface ColorPickerModalProps {
  visible: boolean;
  title: string;
  currentColor: string;
  contrastAgainstColor?: string;
  onSelectColor: (color: string) => void;
  onClose: () => void;
}

// 12 Hue families x 6 Brightness/Saturation levels for full visual spectrum coverage
const SPECTRUM_FAMILIES = [
  {
    name: 'Reds',
    shades: ['#FEE2E2', '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#991B1B', '#450A0A'],
  },
  {
    name: 'Coral / Orange',
    shades: ['#FFEDD5', '#FDBA74', '#FB923C', '#F97316', '#EA580C', '#9A3412', '#431407'],
  },
  {
    name: 'Amber',
    shades: ['#FEF3C7', '#FDE68A', '#FCD34D', '#F59E0B', '#D97706', '#92400E', '#451A03'],
  },
  {
    name: 'Yellow / Lime',
    shades: ['#FEF9C3', '#FEF08A', '#FACC15', '#EAB308', '#84CC16', '#4D7C0F', '#1A2E05'],
  },
  {
    name: 'Emerald / Green',
    shades: ['#D1FAE5', '#A7F3D0', '#34D399', '#10B981', '#059669', '#065F46', '#022C22'],
  },
  {
    name: 'Teal / Cyan',
    shades: ['#CCFBF1', '#99F6E4', '#2DD4BF', '#14B8A6', '#0D9488', '#115E59', '#042F2E'],
  },
  {
    name: 'Sky / Ocean',
    shades: ['#E0F2FE', '#BAE6FD', '#38BDF8', '#0EA5E9', '#0284C7', '#075985', '#082F49'],
  },
  {
    name: 'Blue / Indigo',
    shades: ['#E0E7FF', '#C7D2FE', '#818CF8', '#6366F1', '#4F46E5', '#3730A3', '#1E1B4B'],
  },
  {
    name: 'Purple / Violet',
    shades: ['#EDE9FE', '#DDD6FE', '#A78BFA', '#8B5CF6', '#7C3AED', '#5B21B6', '#2E1065'],
  },
  {
    name: 'Fuchsia / Magenta',
    shades: ['#FAE8FF', '#F5D0FE', '#E879F9', '#D946EF', '#C026D3', '#86198F', '#4A044E'],
  },
  {
    name: 'Rose / Pink',
    shades: ['#FFE4E6', '#FECDD3', '#FB7185', '#F43F5E', '#E11D48', '#9F1239', '#4C0519'],
  },
  {
    name: 'Monochrome / Slate',
    shades: ['#FFFFFF', '#F1F5F9', '#CBD5E1', '#94A3B8', '#475569', '#1E293B', '#000000'],
  },
];

// Quick Hue Bar for continuous visual spectrum sliding
const HUE_BAR = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#10B981',
  '#06B6D4',
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#D946EF',
  '#F43F5E',
];

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  visible,
  title,
  currentColor,
  contrastAgainstColor,
  onSelectColor,
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const [selectedHex, setSelectedHex] = useState(currentColor || '#000000');
  const [customHexInput, setCustomHexInput] = useState(currentColor || '#000000');

  useEffect(() => {
    if (visible) {
      setSelectedHex(currentColor || '#000000');
      setCustomHexInput(currentColor || '#000000');
    }
  }, [visible, currentColor]);

  const handleSelect = (hex: string) => {
    triggerLightHaptic();
    const upper = hex.toUpperCase();
    setSelectedHex(upper);
    setCustomHexInput(upper);
    onSelectColor(upper);
  };

  const handleManualHexChange = (text: string) => {
    setCustomHexInput(text);
    let clean = text.trim();
    if (!clean.startsWith('#')) clean = `#${clean}`;
    if (/^#[0-9A-F]{6}$/i.test(clean) || /^#[0-9A-F]{3}$/i.test(clean)) {
      setSelectedHex(clean.toUpperCase());
      onSelectColor(clean.toUpperCase());
    }
  };

  // Real-time contrast check
  const contrast = contrastAgainstColor
    ? QRGeneratorService.checkContrast(selectedHex, contrastAgainstColor)
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheetContent,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.colorPreviewBubble, { backgroundColor: selectedHex }]} />
              <View>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {selectedHex.toUpperCase()}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={[styles.doneBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Live Contrast Warning Banner if applicable */}
            {contrast && !contrast.isValid && (
              <View
                style={[
                  styles.warningBox,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : palette.rose[50],
                    borderColor: palette.rose[500],
                  },
                ]}
              >
                <Ionicons name="warning" size={16} color={palette.rose[500]} style={{ marginRight: 6 }} />
                <Text style={[styles.warningText, { color: palette.rose[600] }]}>
                  QR and background colors need more contrast for camera scanning.
                </Text>
              </View>
            )}

            {/* Quick Continuous Spectrum Hue Bar */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              HUE SPECTRUM
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hueBarRow}
            >
              {HUE_BAR.map((hue) => {
                const isSelected = selectedHex.toLowerCase() === hue.toLowerCase();
                return (
                  <Pressable
                    key={hue}
                    onPress={() => handleSelect(hue)}
                    style={[
                      styles.hueChip,
                      {
                        backgroundColor: hue,
                        borderColor: isSelected ? theme.primary : '#E2E8F0',
                        borderWidth: isSelected ? 3 : 1,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Visual Color Spectrum Matrix */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: spacing.md }]}>
              COLOR SPECTRUM PALETTE
            </Text>
            <View style={styles.spectrumMatrix}>
              {SPECTRUM_FAMILIES.map((family) => (
                <View key={family.name} style={styles.familyRow}>
                  {family.shades.map((shade) => {
                    const isSelected = selectedHex.toLowerCase() === shade.toLowerCase();
                    const isLightShade =
                      shade === '#FFFFFF' || shade === '#F1F5F9' || shade === '#FEE2E2' || shade === '#FEF3C7' || shade === '#D1FAE5' || shade === '#E0F2FE' || shade === '#EDE9FE';
                    return (
                      <Pressable
                        key={shade}
                        onPress={() => handleSelect(shade)}
                        style={[
                          styles.shadeTile,
                          {
                            backgroundColor: shade,
                            borderColor: isSelected ? theme.primary : isLightShade ? '#CBD5E1' : shade,
                            borderWidth: isSelected ? 2.5 : isLightShade ? 1 : 0,
                          },
                        ]}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color={isLightShade ? '#0F172A' : '#FFFFFF'}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Optional Hex Code Display */}
            <View style={[styles.hexDisplayRow, { backgroundColor: theme.surfaceVariant, borderColor: theme.borderLight }]}>
              <Text style={[styles.hexPrefix, { color: theme.textSecondary }]}>Hex Code:</Text>
              <TextInput
                style={[
                  styles.hexInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={customHexInput}
                onChangeText={handleManualHexChange}
                placeholder="#000000"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="characters"
                maxLength={7}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContent: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    borderTopWidth: 1,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorPreviewBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  doneBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollBody: {
    padding: spacing.md,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  hueBarRow: {
    gap: 8,
    paddingVertical: 4,
  },
  hueChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spectrumMatrix: {
    gap: 6,
    marginTop: 2,
  },
  familyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  shadeTile: {
    flex: 1,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  hexPrefix: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  hexInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
