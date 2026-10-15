import { Camera, BarcodeType } from 'expo-camera';
import { manipulateAsync, SaveFormat, Action } from 'expo-image-manipulator';

/**
 * Decodes QR codes / barcodes from a LOCAL image (no upload).
 * Uses the same native decoder family as the live camera (expo-camera's
 * static-image scanner) and retries with normalized / resized / rotated /
 * cropped copies of the image when the first attempt finds nothing.
 */

export interface DecodedCode {
  /** 'qr' for QR codes, otherwise the barcode format (ean13, code128, ...) */
  format: string;
  isQR: boolean;
  data: string;
  label: string;
}

const BARCODE_TYPES: BarcodeType[] = [
  'qr',
  'code128',
  'code39',
  'code93',
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'itf14',
  'codabar',
  'pdf417',
  'aztec',
  'datamatrix',
];

const FORMAT_LABELS: Record<string, string> = {
  qr: 'QR Code',
  code128: 'CODE128',
  code39: 'CODE39',
  code93: 'CODE93',
  ean13: 'EAN-13',
  ean8: 'EAN-8',
  upc_a: 'UPC-A',
  upc_e: 'UPC-E',
  itf14: 'ITF',
  codabar: 'Codabar',
  pdf417: 'PDF417',
  aztec: 'Aztec',
  datamatrix: 'Data Matrix',
};

const MAX_DIMENSION = 2000; // downscale huge photos
const MIN_DIMENSION = 800; // upscale tiny images

async function tryDecode(uri: string): Promise<DecodedCode[]> {
  try {
    const results = await Camera.scanFromURLAsync(uri, BARCODE_TYPES);
    const seen = new Set<string>();
    const out: DecodedCode[] = [];
    for (const r of results || []) {
      const data = (r?.data ?? '').toString();
      if (!data) continue;
      const format = String(r.type || 'qr').toLowerCase().replace('org.iso.', '');
      const isQR = format.includes('qr');
      const key = `${format}|${data}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        format: isQR ? 'qr' : format,
        isQR,
        data,
        label: FORMAT_LABELS[isQR ? 'qr' : format] || format.toUpperCase(),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function makeCopy(
  uri: string,
  actions: Action[],
  compress = 1
): Promise<{ uri: string; width: number; height: number } | null> {
  try {
    const res = await manipulateAsync(uri, actions, {
      compress,
      format: SaveFormat.PNG,
    });
    return { uri: res.uri, width: res.width, height: res.height };
  } catch {
    return null;
  }
}

export const ImageScanService = {
  /**
   * @returns detected codes (empty array when nothing could be decoded)
   */
  async decodeImage(originalUri: string): Promise<DecodedCode[]> {
    // Pass 1 – original image as-is
    let found = await tryDecode(originalUri);
    if (found.length) return found;

    // Pass 2 – normalize: copies content:// to a file://, applies EXIF
    // rotation, and downsizes extremely large photos.
    let base = await makeCopy(originalUri, []);
    if (!base) return [];

    if (Math.max(base.width, base.height) > MAX_DIMENSION) {
      const resize: Action =
        base.width >= base.height
          ? { resize: { width: MAX_DIMENSION } }
          : { resize: { height: MAX_DIMENSION } };
      base = (await makeCopy(base.uri, [resize])) || base;
    }

    found = await tryDecode(base.uri);
    if (found.length) return found;

    // Pass 3 – upscale small / low-resolution images
    if (Math.max(base.width, base.height) < MIN_DIMENSION) {
      const up = await makeCopy(base.uri, [
        base.width >= base.height
          ? { resize: { width: MIN_DIMENSION } }
          : { resize: { height: MIN_DIMENSION } },
      ]);
      if (up) {
        found = await tryDecode(up.uri);
        if (found.length) return found;
      }
    }

    // Pass 4 – rotations (decoder is orientation-tolerant for most
    // formats, but 1D barcodes in rotated images are not always found)
    for (const deg of [90, 180, 270]) {
      const rotated = await makeCopy(base.uri, [{ rotate: deg }]);
      if (!rotated) continue;
      found = await tryDecode(rotated.uri);
      if (found.length) return found;
    }

    // Pass 5 – small code inside a larger photo: scan zoomed crops
    // (center + 4 overlapping quadrants), upscaled for the decoder.
    const { width: w, height: h } = base;
    const cw = Math.round(w * 0.6);
    const ch = Math.round(h * 0.6);
    const crops = [
      { originX: Math.round((w - cw) / 2), originY: Math.round((h - ch) / 2) },
      { originX: 0, originY: 0 },
      { originX: w - cw, originY: 0 },
      { originX: 0, originY: h - ch },
      { originX: w - cw, originY: h - ch },
    ];
    for (const c of crops) {
      const cropped = await makeCopy(base.uri, [
        { crop: { originX: c.originX, originY: c.originY, width: cw, height: ch } },
        { resize: { width: Math.max(cw, MIN_DIMENSION) } },
      ]);
      if (!cropped) continue;
      found = await tryDecode(cropped.uri);
      if (found.length) return found;
    }

    return [];
  },
};
