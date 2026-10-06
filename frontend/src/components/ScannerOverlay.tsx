import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius, spacing } from '../theme/typography';
import { triggerLightHaptic } from '../utils/feedback';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCANNER_SIZE = Math.min(SCREEN_WIDTH * 0.72, 280);

interface ScannerOverlayProps {
  torchEnabled: boolean;
  onToggleTorch: () => void;
  onPickImage: () => void;
  onClose: () => void;
  isScanning: boolean;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  torchEnabled,
  onToggleTorch,
  onPickImage,
  onClose,
  isScanning,
}) => {
  const insets = useSafeAreaInsets();
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isScanning) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isScanning]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCANNER_SIZE - 4],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => {
            triggerLightHaptic();
            onClose();
          }}
          style={styles.circleBtn}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>SCAN QR CODE</Text>
          <Text style={styles.headerSubtitle}>Ready to scan</Text>
        </View>

        <Pressable
          onPress={() => {
            triggerLightHaptic();
            onToggleTorch();
          }}
          style={[
            styles.circleBtn,
            torchEnabled && { backgroundColor: palette.emerald[500] },
          ]}
        >
          <Ionicons
            name={torchEnabled ? 'flash' : 'flash-outline'}
            size={22}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      {/* Frame Center Area */}
      <View style={styles.frameContainer}>
        {/* Viewfinder Box */}
        <View style={styles.viewfinder}>
          {/* Glowing Animated Scan Line */}
          {isScanning && (
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY }] },
              ]}
            />
          )}

          {/* Corner Brackets */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Instructions Badge */}
        <View style={styles.instructionBadge}>
          <Ionicons name="scan-outline" size={16} color={palette.emerald[400]} style={{ marginRight: 6 }} />
          <Text style={styles.instructionText}>Align the QR code within the frame</Text>
        </View>
      </View>

      {/* Bottom Floating Control Dock */}
      <View style={[styles.bottomDock, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.dockCard}>
          {/* Torch Button */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              onToggleTorch();
            }}
            style={({ pressed }) => [
              styles.dockBtn,
              torchEnabled && styles.dockBtnActive,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons
              name={torchEnabled ? 'flash' : 'flash-outline'}
              size={22}
              color={torchEnabled ? palette.emerald[400] : '#FFFFFF'}
            />
            <Text style={[styles.dockBtnText, torchEnabled && styles.dockBtnTextActive]}>
              {torchEnabled ? 'Flash ON' : 'Flashlight'}
            </Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.dockDivider} />

          {/* Gallery Picker Button */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              onPickImage();
            }}
            style={({ pressed }) => [
              styles.dockBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="images-outline" size={22} color="#FFFFFF" />
            <Text style={styles.dockBtnText}>Choose Image</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const CORNER_SIZE = 26;
const CORNER_BORDER = 4;
const CORNER_RADIUS = 12;

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    color: palette.emerald[300],
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    borderRadius: borderRadius['2xl'],
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: palette.emerald[400],
    borderRadius: 2,
    shadowColor: palette.emerald[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: palette.emerald[400],
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderTopRightRadius: CORNER_RADIUS,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderBottomRightRadius: CORNER_RADIUS,
  },
  instructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  instructionText: {
    color: '#F8FAFC',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  bottomDock: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  dockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  dockBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  dockBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.sm,
  },
  dockBtnTextActive: {
    color: palette.emerald[400],
    fontWeight: typography.fontWeight.bold,
  },
  dockDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: spacing.xs,
  },
});
