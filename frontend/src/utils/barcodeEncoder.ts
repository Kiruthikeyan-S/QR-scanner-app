export type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPCA' | 'UPCE';

export interface BarcodeEncodingResult {
  valid: boolean;
  error?: string;
  pattern?: string; // string of '1' (bar) and '0' (space)
  displayValue: string;
  format: BarcodeFormat;
}

// -------------------------------------------------------------
// Check Digit Calculators
// -------------------------------------------------------------
export function calculateEAN13Checksum(digits: string): string {
  const clean = digits.slice(0, 12);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(clean[i], 10);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return clean + check.toString();
}

export function calculateEAN8Checksum(digits: string): string {
  const clean = digits.slice(0, 7);
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = parseInt(clean[i], 10);
    sum += i % 2 === 0 ? d * 3 : d;
  }
  const check = (10 - (sum % 10)) % 10;
  return clean + check.toString();
}

export function calculateUPCAChecksum(digits: string): string {
  const clean = digits.slice(0, 11);
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const d = parseInt(clean[i], 10);
    sum += i % 2 === 0 ? d * 3 : d;
  }
  const check = (10 - (sum % 10)) % 10;
  return clean + check.toString();
}

// -------------------------------------------------------------
// CODE 39 Tables
// -------------------------------------------------------------
const CODE39_MAP: Record<string, string> = {
  '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
  '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
  '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
  'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
  'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
  'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
  'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
  'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
  'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
  '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101',
  '$': '100100100101', '/': '100100101001', '+': '100101001001', '%': '101001001001'
};

// -------------------------------------------------------------
// EAN Tables (L, G, R patterns)
// -------------------------------------------------------------
const EAN_L: string[] = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011'
];
const EAN_G: string[] = [
  '0100111', '0110011', '0011011', '0100001', '0011101',
  '0111001', '0000101', '0010001', '0001001', '0010111'
];
const EAN_R: string[] = [
  '1110010', '1100110', '1101100', '1000010', '1011100',
  '1001110', '1010000', '1000100', '1001000', '1110100'
];

const EAN13_PARITY: string[] = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'
];

// -------------------------------------------------------------
// CODE 128 (Subset B)
// -------------------------------------------------------------
const CODE128_PATTERNS: string[] = [
  '11011001100', '11001101100', '11001100110', '10010011000', '10010001100', // 0-4
  '10001001100', '10011001000', '10011000100', '10001100100', '11001001000', // 5-9
  '11001000100', '11000100100', '10110011100', '10011011100', '10011001110', // 10-14
  '10111001100', '10011101100', '10011100110', '11001110010', '11001011100', // 15-19
  '11001001110', '11011100100', '11001110100', '11101101110', '11101001100', // 20-24
  '11100101100', '11100100110', '11101100100', '11100110100', '11100110010', // 25-29
  '11011011000', '11011000110', '11000110110', '10100011000', '10001011000', // 30-34
  '10001000110', '10110001000', '10001101000', '10001100010', '11010001000', // 35-39
  '11000101000', '11000100010', '10110111000', '10110001110', '10001101110', // 40-44
  '10111011000', '10111000110', '10001110110', '11101110110', '11010001110', // 45-49
  '11000101110', '11011101000', '11011100010', '11011101110', '11101011000', // 50-54
  '11101000110', '11100010110', '11101101000', '11101100010', '11100011010', // 55-59
  '11101111010', '11001000010', '11110001010', '10100110000', '10100001100', // 60-64
  '10010110000', '10010000110', '10000101100', '10000100110', '10110010000', // 65-69
  '10110000100', '10011010000', '10011000010', '10000110100', '10000110010', // 70-74
  '11000010010', '11001010000', '11110111010', '11000010100', '10001111010', // 75-79
  '10100111100', '10010111100', '10010011110', '10111100100', '10011110100', // 80-84
  '10011110010', '11110100100', '11110010100', '11110010010', '11011011110', // 85-89
  '11011110110', '11110110110', '10101111000', '10100011110', '10001011110', // 90-94
  '10111101000', '10111100010', '11110101000', '11110100010', '10111011110', // 95-99
  '10111101110', '11101011110', '11110101110', '11010000100', '11010010000', // 100-104 (Start B = 104)
  '11010011100', '1100011101011' // Stop = 106
];

// -------------------------------------------------------------
// Barcode Encoder Main
// -------------------------------------------------------------
export const BarcodeEncoder = {
  encode(rawText: string, format: BarcodeFormat): BarcodeEncodingResult {
    const text = (rawText || '').trim();

    if (!text) {
      return { valid: false, error: 'Please enter a barcode value.', displayValue: '', format };
    }

    switch (format) {
      case 'CODE128':
        return this.encodeCode128(text);
      case 'CODE39':
        return this.encodeCode39(text);
      case 'EAN13':
        return this.encodeEAN13(text);
      case 'EAN8':
        return this.encodeEAN8(text);
      case 'UPCA':
        return this.encodeUPCA(text);
      case 'UPCE':
        return this.encodeUPCE(text);
      default:
        return this.encodeCode128(text);
    }
  },

  encodeCode128(text: string): BarcodeEncodingResult {
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code < 32 || code > 126) {
        return { valid: false, error: 'Code 128 accepts standard printable ASCII characters (space to ~).', displayValue: text, format: 'CODE128' };
      }
    }

    const startB = 104;
    let checksum = startB;
    let pattern = CODE128_PATTERNS[startB];

    for (let i = 0; i < text.length; i++) {
      const val = text.charCodeAt(i) - 32;
      checksum += val * (i + 1);
      pattern += CODE128_PATTERNS[val];
    }

    const checkValue = checksum % 103;
    pattern += CODE128_PATTERNS[checkValue];
    pattern += CODE128_PATTERNS[106]; // Stop code

    // Add quiet zones
    pattern = '0000000000' + pattern + '0000000000';

    return {
      valid: true,
      pattern,
      displayValue: text,
      format: 'CODE128',
    };
  },

  encodeCode39(text: string): BarcodeEncodingResult {
    const upper = text.toUpperCase();
    for (let i = 0; i < upper.length; i++) {
      if (!CODE39_MAP[upper[i]]) {
        return {
          valid: false,
          error: `Invalid character '${upper[i]}' for Code 39. Only A-Z, 0-9, and - . $ / + % space are supported.`,
          displayValue: text,
          format: 'CODE39',
        };
      }
    }

    let pattern = CODE39_MAP['*'] + '0';
    for (let i = 0; i < upper.length; i++) {
      pattern += CODE39_MAP[upper[i]] + '0';
    }
    pattern += CODE39_MAP['*'];
    pattern = '0000000000' + pattern + '0000000000';

    return {
      valid: true,
      pattern,
      displayValue: `*${upper}*`,
      format: 'CODE39',
    };
  },

  encodeEAN13(text: string): BarcodeEncodingResult {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits.length !== 12 && digits.length !== 13) {
      return { valid: false, error: 'EAN-13 requires exactly 12 or 13 numeric digits.', displayValue: text, format: 'EAN13' };
    }

    const fullCode = calculateEAN13Checksum(digits);
    const firstDigit = parseInt(fullCode[0], 10);
    const parity = EAN13_PARITY[firstDigit];

    let pattern = '101'; // Left guard

    // First group of 6
    for (let i = 1; i <= 6; i++) {
      const d = parseInt(fullCode[i], 10);
      pattern += parity[i - 1] === 'L' ? EAN_L[d] : EAN_G[d];
    }

    pattern += '01010'; // Center guard

    // Second group of 6 (all R)
    for (let i = 7; i <= 12; i++) {
      const d = parseInt(fullCode[i], 10);
      pattern += EAN_R[d];
    }

    pattern += '101'; // Right guard
    pattern = '000000000' + pattern + '000000000';

    return {
      valid: true,
      pattern,
      displayValue: `${fullCode[0]} ${fullCode.slice(1, 7)} ${fullCode.slice(7)}`,
      format: 'EAN13',
    };
  },

  encodeEAN8(text: string): BarcodeEncodingResult {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits.length !== 7 && digits.length !== 8) {
      return { valid: false, error: 'EAN-8 requires exactly 7 or 8 numeric digits.', displayValue: text, format: 'EAN8' };
    }

    const fullCode = calculateEAN8Checksum(digits);
    let pattern = '101'; // Left guard

    for (let i = 0; i < 4; i++) {
      const d = parseInt(fullCode[i], 10);
      pattern += EAN_L[d];
    }

    pattern += '01010'; // Center guard

    for (let i = 4; i < 8; i++) {
      const d = parseInt(fullCode[i], 10);
      pattern += EAN_R[d];
    }

    pattern += '101'; // Right guard
    pattern = '00000000' + pattern + '00000000';

    return {
      valid: true,
      pattern,
      displayValue: `${fullCode.slice(0, 4)} ${fullCode.slice(4)}`,
      format: 'EAN8',
    };
  },

  encodeUPCA(text: string): BarcodeEncodingResult {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits.length !== 11 && digits.length !== 12) {
      return { valid: false, error: 'UPC-A requires exactly 11 or 12 numeric digits.', displayValue: text, format: 'UPCA' };
    }

    const fullCode = calculateUPCAChecksum(digits);
    // UPC-A is essentially EAN-13 with leading '0'
    return this.encodeEAN13('0' + fullCode);
  },

  encodeUPCE(text: string): BarcodeEncodingResult {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits.length < 6 || digits.length > 8) {
      return { valid: false, error: 'UPC-E requires 6 to 8 numeric digits.', displayValue: text, format: 'UPCE' };
    }

    // Default to standard Code 128 encoding of the UPC-E numeric payload
    return this.encodeCode128(digits);
  },
};
