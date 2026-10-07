export type QRType =
  | 'url'
  | 'text'
  | 'wifi'
  | 'phone'
  | 'email'
  | 'sms'
  | 'contact'
  | 'location'
  | 'barcode'
  | 'photo'
  | 'file';

export interface QRCustomization {
  fgColor: string;
  bgColor: string;
  centerIcon?: string;
  customLogoUri?: string;
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

export interface UploadedFileMeta {
  token_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  size_formatted: string;
  file_type: 'photo' | 'file';
  view_url: string;
  download_url: string;
  qr_url: string;
}

export interface ScanRecord {
  id: string;
  type: QRType;
  data: string;
  scanned_at: string;
}

export interface SavedQRRecord {
  id: string;
  name: string;
  type: QRType;
  data: string;
  created_at: string;
  updated_at: string;
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
