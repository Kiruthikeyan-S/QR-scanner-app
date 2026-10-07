import { QRType } from '../types/qr';
import { palette } from '../theme/colors';

export interface QRTypeMetadata {
  type: QRType;
  label: string;
  description: string;
  iconName: string;
  color: string;
  badgeBgLight: string;
  badgeBgDark: string;
  prefixExample: string;
}

export const QR_TYPES: Record<QRType, QRTypeMetadata> = {
  url: {
    type: 'url',
    label: 'Website URL',
    description: 'Link to a web page, social profile, or web application',
    iconName: 'globe-outline',
    color: palette.emerald[600],
    badgeBgLight: palette.emerald[50],
    badgeBgDark: 'rgba(16, 185, 129, 0.15)',
    prefixExample: 'https://example.com',
  },
  wifi: {
    type: 'wifi',
    label: 'Wi-Fi Network',
    description: 'Connect instantly to a wireless network with credentials',
    iconName: 'wifi-outline',
    color: palette.indigo[600],
    badgeBgLight: palette.indigo[50],
    badgeBgDark: 'rgba(99, 102, 241, 0.15)',
    prefixExample: 'WIFI:S:MyNetwork;P:pass;;',
  },
  text: {
    type: 'text',
    label: 'Plain Text',
    description: 'General text notes, serial numbers, codes, or messages',
    iconName: 'document-text-outline',
    color: palette.cyan[600],
    badgeBgLight: palette.cyan[50],
    badgeBgDark: 'rgba(6, 182, 212, 0.15)',
    prefixExample: 'Sample text message',
  },
  phone: {
    type: 'phone',
    label: 'Phone Number',
    description: 'Directly dial a phone number with country code',
    iconName: 'call-outline',
    color: palette.emerald[500],
    badgeBgLight: palette.emerald[50],
    badgeBgDark: 'rgba(16, 185, 129, 0.15)',
    prefixExample: 'tel:+1234567890',
  },
  email: {
    type: 'email',
    label: 'Email Address',
    description: 'Pre-filled email recipient, subject, and message',
    iconName: 'mail-outline',
    color: palette.indigo[500],
    badgeBgLight: palette.indigo[50],
    badgeBgDark: 'rgba(99, 102, 241, 0.15)',
    prefixExample: 'mailto:name@example.com',
  },
  sms: {
    type: 'sms',
    label: 'SMS Message',
    description: 'Send a formatted SMS text to a phone number',
    iconName: 'chatbubble-ellipses-outline',
    color: palette.cyan[500],
    badgeBgLight: palette.cyan[50],
    badgeBgDark: 'rgba(6, 182, 212, 0.15)',
    prefixExample: 'smsto:+1234567890:Hello',
  },
  contact: {
    type: 'contact',
    label: 'Contact Card (vCard)',
    description: 'Share contact name, phone, email, company, and address',
    iconName: 'person-outline',
    color: palette.emerald[600],
    badgeBgLight: palette.emerald[50],
    badgeBgDark: 'rgba(16, 185, 129, 0.15)',
    prefixExample: 'BEGIN:VCARD...',
  },
  location: {
    type: 'location',
    label: 'Geo Location',
    description: 'Coordinates to view on Google Maps or Apple Maps',
    iconName: 'location-outline',
    color: palette.amber[500],
    badgeBgLight: palette.amber[50],
    badgeBgDark: 'rgba(245, 158, 11, 0.15)',
    prefixExample: 'geo:37.7749,-122.4194',
  },
  barcode: {
    type: 'barcode',
    label: 'Barcode',
    description: 'Product or inventory linear barcode',
    iconName: 'barcode-outline',
    color: palette.indigo[600],
    badgeBgLight: palette.indigo[50],
    badgeBgDark: 'rgba(99, 102, 241, 0.15)',
    prefixExample: '8901234567890',
  },
  photo: {
    type: 'photo',
    label: 'Photo QR',
    description: 'Upload and share image or photo via secure QR code',
    iconName: 'image-outline',
    color: palette.emerald[500],
    badgeBgLight: palette.emerald[50],
    badgeBgDark: 'rgba(16, 185, 129, 0.15)',
    prefixExample: 'https://api.example.com/files/P-8X29K',
  },
  file: {
    type: 'file',
    label: 'File / PDF QR',
    description: 'Upload and share PDF, documents, or data files via QR code',
    iconName: 'document-attach-outline',
    color: palette.cyan[600],
    badgeBgLight: palette.cyan[50],
    badgeBgDark: 'rgba(6, 182, 212, 0.15)',
    prefixExample: 'https://api.example.com/files/F-a82Mx91P',
  },
};

export const APP_INFO = {
  name: 'QR Smart',
  tagline: 'Scanner & Generator',
  version: '1.0.0',
  build: '100',
  designSystem: 'Optical Clarity',
  copyright: '© 2026 QR Smart Team',
};
