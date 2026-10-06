export type QRType =
  | 'url'
  | 'text'
  | 'wifi'
  | 'phone'
  | 'email'
  | 'sms'
  | 'contact'
  | 'location';

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
