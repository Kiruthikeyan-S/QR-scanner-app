export type QRType =
  | 'text'
  | 'url'
  | 'wifi'
  | 'phone'
  | 'email'
  | 'sms'
  | 'contact'
  | 'location'
  | 'photo'
  | 'file'
  | 'order_id'
  | 'json'
  | 'barcode';

export type QRPattern = 'square' | 'rounded' | 'dots';
export type QRCornerStyle = 'classic' | 'rounded' | 'soft';
export type QRFrame = 'none' | 'simple' | 'rounded' | 'scan_me';
export type QRThemeId = 'classic' | 'green' | 'ocean' | 'purple' | 'dark' | 'custom';
export type PhotoQuality = 'optimized' | 'original';
export type QRExportSize = 512 | 1024 | 2048;

export interface QRCustomization {
  fgColor: string;
  bgColor: string;
  centerIcon?: string;
  customLogoUri?: string;
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  pattern?: QRPattern;
  cornerStyle?: QRCornerStyle;
  frame?: QRFrame;
  themeId?: QRThemeId;
  photoQuality?: PhotoQuality;
  exportSize?: QRExportSize;
}

export interface UploadedFileMeta {
  token_id: string;
  file_id?: string;
  original_name?: string;
  filename: string;
  content_type: string;
  file_category?: string;
  file_type_label?: string;
  size_bytes: number;
  size_formatted: string;
  file_type: 'photo' | 'file';
  storage_path?: string;
  view_url: string;
  download_url: string;
  qr_url: string;
  url?: string;
  storage_provider?: string;
  is_supabase?: boolean;
  expires_at?: string;
}

export type URLSafetyStatus = 'safe' | 'suspicious' | 'unsafe' | 'unknown';

export interface URLSafetyDetails {
  status: URLSafetyStatus;
  riskScore: number;
  domain: string;
  normalizedUrl: string;
  scheme: string;
  isHttps: boolean;
  reasons: string[];
  checkedAt: string;
}

export interface ScanRecord {
  id: string;
  type: QRType;
  data: string;
  scanned_at: string;
  safetyStatus?: URLSafetyStatus;
}

export interface SavedQRRecord {
  id: string;
  name: string;
  type: QRType;
  data: string;
  created_at: string;
  updated_at: string;
  fileName?: string;
  url?: string;
}

export interface ParsedQRDetails {
  type: QRType;
  raw: string;
  title: string;
  subtitle?: string;
  fields: { label: string; value: string; isSensitive?: boolean }[];
  primaryAction: {
    label: string;
    icon: string;
    actionType: 'open_url' | 'call' | 'email' | 'sms' | 'map' | 'copy';
  };
}

export interface WifiFormData {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface ContactFormData {
  fullName: string;
  phone: string;
  email: string;
  company: string;
  website: string;
  address: string;
}

export interface LocationFormData {
  latitude: string;
  longitude: string;
  label?: string;
}

export interface PhoneFormData {
  countryCode: string;
  phoneNumber: string;
}

export interface EmailFormData {
  email: string;
  subject: string;
  body: string;
}

export interface SMSFormData {
  phoneNumber: string;
  message: string;
}

export interface TextFormData {
  text: string;
}

export interface URLFormData {
  url: string;
}

export interface OrderFormData {
  orderId: string;
  customerName?: string;
  reference?: string;
  note?: string;
}

export interface JSONFormData {
  jsonString: string;
}
