import { qrcodegen } from '../lib/qrcodegen';
import { QRCustomization, QRPattern, QRCornerStyle } from '../types/qr';

export interface QRGenerationOptions {
  payload: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  size?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  quietZone?: number;
  hasLogoOrIcon?: boolean;
  pattern?: QRPattern;
  cornerStyle?: QRCornerStyle;
}

export interface QRGenerationResult {
  matrix: boolean[][];
  matrixSize: number;
  totalSize: number;
  quietZone: number;
  svgPath: string;
  viewBox: string;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  isValidContrast: boolean;
  contrastRatio: number;
  contrastWarning?: string;
}

export const QRGeneratorService = {
  /**
   * Map standard letter ECL ('L', 'M', 'Q', 'H') to qrcodegen.QrCode.Ecc
   */
  mapEcc(ecl?: 'L' | 'M' | 'Q' | 'H', hasLogoOrIcon: boolean = false): {
    qrcodegenEcc: qrcodegen.QrCode.Ecc;
    level: 'L' | 'M' | 'Q' | 'H';
  } {
    // If a center logo or icon is present, automatically enforce High ('H') error correction (30% recovery)
    if (hasLogoOrIcon) {
      return { qrcodegenEcc: qrcodegen.QrCode.Ecc.HIGH, level: 'H' };
    }

    switch (ecl?.toUpperCase()) {
      case 'L':
        return { qrcodegenEcc: qrcodegen.QrCode.Ecc.LOW, level: 'L' };
      case 'Q':
        return { qrcodegenEcc: qrcodegen.QrCode.Ecc.QUARTILE, level: 'Q' };
      case 'H':
        return { qrcodegenEcc: qrcodegen.QrCode.Ecc.HIGH, level: 'H' };
      case 'M':
      default:
        return { qrcodegenEcc: qrcodegen.QrCode.Ecc.MEDIUM, level: 'M' };
    }
  },

  /**
   * Calculate WCAG 2.1 relative luminance and contrast ratio between FG & BG
   */
  getLuminance(hexColor: string): number {
    let hex = hexColor.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length !== 6) return 0;

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const transform = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
  },

  checkContrast(fgHex: string, bgHex: string): { isValid: boolean; ratio: number; warning?: string } {
    try {
      const l1 = this.getLuminance(fgHex);
      const l2 = this.getLuminance(bgHex);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      const ratio = (lighter + 0.05) / (darker + 0.05);

      if (ratio < 2.5) {
        return {
          isValid: false,
          ratio: parseFloat(ratio.toFixed(2)),
          warning: 'QR and background colors need more contrast.',
        };
      }
      return {
        isValid: true,
        ratio: parseFloat(ratio.toFixed(2)),
      };
    } catch {
      return { isValid: true, ratio: 21 };
    }
  },

  /**
   * Check if a module position is part of any of the 3 finder patterns
   */
  isFinderPattern(x: number, y: number, quietZone: number, matrixSize: number): boolean {
    const qrX = x - quietZone;
    const qrY = y - quietZone;
    if (qrX < 0 || qrY < 0 || qrX >= matrixSize || qrY >= matrixSize) return false;

    // Top-Left 7x7
    if (qrX < 7 && qrY < 7) return true;
    // Top-Right 7x7
    if (qrX >= matrixSize - 7 && qrY < 7) return true;
    // Bottom-Left 7x7
    if (qrX < 7 && qrY >= matrixSize - 7) return true;

    return false;
  },

  /**
   * Generate QR Matrix and SVG Path using Nayuki qrcodegen
   */
  generateQR(options: QRGenerationOptions): QRGenerationResult {
    const text = options.payload || 'https://qrsmart.app';
    const quietZone = typeof options.quietZone === 'number' ? options.quietZone : 4;
    const fg = options.foregroundColor || '#000000';
    const bg = options.backgroundColor || '#FFFFFF';
    const pattern = options.pattern || 'square';
    const cornerStyle = options.cornerStyle || 'classic';

    const { qrcodegenEcc, level } = this.mapEcc(
      options.errorCorrectionLevel,
      Boolean(options.hasLogoOrIcon)
    );

    // 1. Generate QR Code using Nayuki qrcodegen
    const qr = qrcodegen.QrCode.encodeText(text, qrcodegenEcc);
    const matrixSize = qr.size;
    const totalSize = matrixSize + quietZone * 2;

    // 2. Build boolean matrix with quiet zone
    const matrix: boolean[][] = [];
    for (let y = 0; y < totalSize; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < totalSize; x++) {
        const qrX = x - quietZone;
        const qrY = y - quietZone;
        if (qrX >= 0 && qrX < matrixSize && qrY >= 0 && qrY < matrixSize) {
          row.push(qr.getModule(qrX, qrY));
        } else {
          row.push(false); // Quiet zone margin
        }
      }
      matrix.push(row);
    }

    // 3. Construct optimized single SVG Path for maximum rendering speed and styling
    let svgPath = '';
    for (let y = 0; y < totalSize; y++) {
      for (let x = 0; x < totalSize; x++) {
        if (matrix[y][x]) {
          const inFinder = this.isFinderPattern(x, y, quietZone, matrixSize);

          if (inFinder) {
            // Finder pattern modules: Keep solid or soft rounded for scan accuracy
            if (cornerStyle === 'rounded' || cornerStyle === 'soft') {
              svgPath += `M${x + 0.15},${y} h0.7 q0.15,0 0.15,0.15 v0.7 q0,0.15 -0.15,0.15 h-0.7 q-0.15,0 -0.15,-0.15 v-0.7 q0,-0.15 0.15,-0.15 z `;
            } else {
              svgPath += `M${x},${y}h1v1h-1z `;
            }
          } else if (pattern === 'dots') {
            // Dot circle module: center cx = x + 0.5, cy = y + 0.5, radius = 0.4
            svgPath += `M${x + 0.5},${y + 0.1} a0.4,0.4 0 1,0 0.001,0 z `;
          } else if (pattern === 'rounded') {
            // Rounded square module
            svgPath += `M${x + 0.2},${y} h0.6 q0.2,0 0.2,0.2 v0.6 q0,0.2 -0.2,0.2 h-0.6 q-0.2,0 -0.2,-0.2 v-0.6 q0,-0.2 0.2,-0.2 z `;
          } else {
            // Classic Square module
            svgPath += `M${x},${y}h1v1h-1z `;
          }
        }
      }
    }

    const contrast = this.checkContrast(fg, bg);

    return {
      matrix,
      matrixSize,
      totalSize,
      quietZone,
      svgPath: svgPath.trim(),
      viewBox: `0 0 ${totalSize} ${totalSize}`,
      foregroundColor: fg,
      backgroundColor: bg,
      errorCorrectionLevel: level,
      isValidContrast: contrast.isValid,
      contrastRatio: contrast.ratio,
      contrastWarning: contrast.warning,
    };
  },

  /**
   * Generate complete SVG XML String for exporting or sharing
   */
  toSvgXml(
    options: QRGenerationOptions,
    customization?: Partial<QRCustomization>
  ): string {
    const res = this.generateQR({
      ...options,
      foregroundColor: customization?.fgColor || options.foregroundColor,
      backgroundColor: customization?.bgColor || options.backgroundColor,
      errorCorrectionLevel: customization?.errorCorrectionLevel || options.errorCorrectionLevel,
      hasLogoOrIcon: Boolean(customization?.centerIcon || customization?.customLogoUri),
      pattern: customization?.pattern || options.pattern,
      cornerStyle: customization?.cornerStyle || options.cornerStyle,
    });

    const size = options.size || 300;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${size}" height="${size}" viewBox="${res.viewBox}">
  <rect width="100%" height="100%" fill="${res.backgroundColor}"/>
  <path d="${res.svgPath}" fill="${res.foregroundColor}"/>
</svg>`;
  },
};
