import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { QRCustomization } from '../types/qr';

interface CustomQRCodeProps {
  value: string;
  size?: number;
  customization?: Partial<QRCustomization>;
  getRef?: (ref: any) => void;
}

export const CustomQRCode: React.FC<CustomQRCodeProps> = ({
  value,
  size = 220,
  customization,
  getRef,
}) => {
  const fgColor = customization?.fgColor || '#000000';
  const bgColor = customization?.bgColor || '#FFFFFF';
  const ecl = customization?.errorCorrectionLevel || (customization?.centerIcon ? 'H' : 'M');
  const customLogoUri = customization?.customLogoUri;
  const centerIcon = customization?.centerIcon;

  const logoSize = Math.round(size * 0.2); // ~20% of QR size safely in center
  const logoPadding = 4;

  return (
    <View style={[styles.container, { backgroundColor: bgColor, width: size + 24, height: size + 24 }]}>
      <QRCode
        value={value || 'https://qrsmart.app'}
        size={size}
        color={fgColor}
        backgroundColor={bgColor}
        ecl={ecl}
        logo={customLogoUri ? { uri: customLogoUri } : undefined}
        logoSize={customLogoUri ? logoSize : 0}
        logoBackgroundColor={bgColor}
        logoMargin={customLogoUri ? logoPadding : 0}
        logoBorderRadius={customLogoUri ? 8 : 0}
        getRef={getRef}
      />

      {/* Render Ionicons Center Icon overlay if preset center icon is selected (not custom file) */}
      {centerIcon && centerIcon !== 'custom' && (
        <View
          style={[
            styles.centerIconOverlay,
            {
              width: logoSize + 8,
              height: logoSize + 8,
              borderRadius: (logoSize + 8) / 2,
              backgroundColor: bgColor,
              borderColor: bgColor,
            },
          ]}
        >
          <Ionicons
            name={centerIcon as any}
            size={Math.round(logoSize * 0.75)}
            color={fgColor}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerIconOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
});
