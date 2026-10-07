import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, G } from 'react-native-svg';
import { BarcodeEncoder, BarcodeFormat } from '../utils/barcodeEncoder';
import { typography, borderRadius } from '../theme/typography';

interface BarcodeRendererProps {
  value: string;
  format: BarcodeFormat;
  width?: number;
  height?: number;
  barColor?: string;
  bgColor?: string;
  showText?: boolean;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format,
  width = 280,
  height = 100,
  barColor = '#000000',
  bgColor = '#FFFFFF',
  showText = true,
}) => {
  const result = BarcodeEncoder.encode(value, format);

  if (!result.valid || !result.pattern) {
    return (
      <View style={[styles.errorBox, { width, height, backgroundColor: bgColor }]}>
        <Text style={styles.errorText}>{result.error || 'Invalid barcode value'}</Text>
      </View>
    );
  }

  const pattern = result.pattern;
  const numModules = pattern.length;
  const moduleWidth = width / numModules;

  // Build Rect bars
  const bars: React.ReactNode[] = [];
  let i = 0;
  while (i < numModules) {
    if (pattern[i] === '1') {
      let runLength = 1;
      while (i + runLength < numModules && pattern[i + runLength] === '1') {
        runLength++;
      }
      bars.push(
        <Rect
          key={i}
          x={i * moduleWidth}
          y={0}
          width={runLength * moduleWidth}
          height={height}
          fill={barColor}
        />
      );
      i += runLength;
    } else {
      i++;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill={bgColor} />
        <G>{bars}</G>
      </Svg>
      {showText && (
        <Text style={[styles.labelText, { color: barColor }]}>
          {result.displayValue}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: borderRadius.lg,
  },
  labelText: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 2,
    marginTop: 6,
    textAlign: 'center',
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
});
