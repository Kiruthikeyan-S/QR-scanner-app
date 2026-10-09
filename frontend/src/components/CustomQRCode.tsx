import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Image as RNImage } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { QRCustomization } from '../types/qr';
import { QRGeneratorService } from '../services/qrGenerator';

interface CustomQRCodeProps {
  value: string;
  size?: number;
  customization?: Partial<QRCustomization>;
  getRef?: (ref: any) => void;
  showContrastWarning?: boolean;
}

export const CustomQRCode: React.FC<CustomQRCodeProps> = ({
  value,
  size = 220,
  customization,
  getRef,
  showContrastWarning = true,
}) => {
  const fgColor = customization?.fgColor || '#000000';
  const bgColor = customization?.bgColor || '#FFFFFF';
  const ecl = customization?.errorCorrectionLevel || 'M';
  const pattern = customization?.pattern || 'square';
  const cornerStyle = customization?.cornerStyle || 'classic';
  const frame = customization?.frame || 'none';
  const customLogoUri = customization?.customLogoUri;
  const centerIcon = customization?.centerIcon;
  const hasLogoOrIcon = Boolean(centerIcon || customLogoUri);

  // Generate QR Matrix & Path using Nayuki qrcodegen
  const qrResult = useMemo(() => {
    return QRGeneratorService.generateQR({
      payload: value || 'https://qrsmart.app',
      foregroundColor: fgColor,
      backgroundColor: bgColor,
      errorCorrectionLevel: ecl,
      hasLogoOrIcon,
      pattern,
      cornerStyle,
      quietZone: 4,
    });
  }, [value, fgColor, bgColor, ecl, hasLogoOrIcon, pattern, cornerStyle]);

  // Pass ref methods if requested
  React.useEffect(() => {
    if (getRef) {
      getRef({
        toSvgXml: () => QRGeneratorService.toSvgXml({ payload: value, size }, customization),
        getMatrix: () => qrResult.matrix,
        qrResult,
      });
    }
  }, [getRef, value, size, customization, qrResult]);

  // Center logo size calculation (~20% of total QR size)
  const logoBoxSize = Math.round(size * 0.22);
  const logoPadding = 4;
  const innerLogoSize = logoBoxSize - logoPadding * 2;

  // Frame container styling based on frame selection
  const getFrameStyles = () => {
    switch (frame) {
      case 'simple':
        return {
          borderWidth: 3,
          borderColor: fgColor,
          borderRadius: 8,
          padding: 8,
        };
      case 'rounded':
        return {
          borderWidth: 2.5,
          borderColor: fgColor,
          borderRadius: 24,
          padding: 12,
        };
      case 'scan_me':
        return {
          borderWidth: 2,
          borderColor: fgColor,
          borderRadius: 16,
          padding: 10,
        };
      case 'none':
      default:
        return {
          borderWidth: 0,
          borderRadius: 16,
          padding: 10,
        };
    }
  };

  return (
    <View style={styles.outerWrapper}>
      {/* Frame wrapper */}
      <View
        style={[
          styles.frameBox,
          getFrameStyles(),
          {
            backgroundColor: bgColor,
          },
        ]}
      >
        {frame === 'scan_me' && (
          <View style={[styles.scanMeTopBadge, { backgroundColor: fgColor }]}>
            <Ionicons name="scan-outline" size={14} color={bgColor} style={{ marginRight: 4 }} />
            <Text style={[styles.scanMeText, { color: bgColor }]}>SCAN ME</Text>
          </View>
        )}

        <View
          style={[
            styles.container,
            {
              backgroundColor: bgColor,
              width: size + 16,
              height: size + 16,
            },
          ]}
        >
          {/* Crisp Vector QR Code Rendered via qrcodegen & react-native-svg */}
          <Svg
            width={size}
            height={size}
            viewBox={qrResult.viewBox}
          >
            {/* Background fill */}
            <Rect
              x={0}
              y={0}
              width="100%"
              height="100%"
              fill={qrResult.backgroundColor}
            />

            {/* Foreground QR modules path */}
            <Path
              d={qrResult.svgPath}
              fill={qrResult.foregroundColor}
            />
          </Svg>

          {/* Center Custom Image Logo with Background Pad */}
          {customLogoUri ? (
            <View
              style={[
                styles.centerPad,
                {
                  width: logoBoxSize,
                  height: logoBoxSize,
                  borderRadius: 10,
                  backgroundColor: bgColor,
                  borderColor: bgColor,
                },
              ]}
            >
              <RNImage
                source={{ uri: customLogoUri }}
                style={{
                  width: innerLogoSize,
                  height: innerLogoSize,
                  borderRadius: 6,
                }}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {/* Center Preset Ionicons Icon with Background Pad */}
          {centerIcon && centerIcon !== 'custom' && !customLogoUri ? (
            <View
              style={[
                styles.centerPad,
                {
                  width: logoBoxSize,
                  height: logoBoxSize,
                  borderRadius: logoBoxSize / 2,
                  backgroundColor: bgColor,
                  borderColor: bgColor,
                },
              ]}
            >
              <Ionicons
                name={centerIcon as any}
                size={Math.round(innerLogoSize * 0.75)}
                color={fgColor}
              />
            </View>
          ) : null}
        </View>

        {frame === 'scan_me' && (
          <View style={styles.scanMeBottomSpace} />
        )}
      </View>

      {/* Contrast Warning if colors are too low-contrast to scan */}
      {showContrastWarning && qrResult.contrastWarning ? (
        <View style={styles.contrastAlertBox}>
          <Ionicons name="warning" size={14} color="#EF4444" style={{ marginRight: 4 }} />
          <Text style={styles.contrastAlertText}>
            {qrResult.contrastWarning}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerPad: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
  },
  frameBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scanMeTopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  scanMeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  scanMeBottomSpace: {
    height: 4,
  },
  contrastAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  contrastAlertText: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '600',
  },
});
