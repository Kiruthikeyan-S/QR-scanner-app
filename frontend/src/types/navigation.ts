import { NavigatorScreenParams } from '@react-navigation/native';
import { QRType, ScanRecord, SavedQRRecord, QRCustomization } from './qr';

export type MainTabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  ScanTab: undefined;
  SavedTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Scanner: undefined;
  ScanResult: {
    data: string;
    type?: QRType;
    scannedAt?: string;
    fromHistoryId?: string;
    safetyResult?: import('./qr').URLSafetyDetails;
  };
  GeneratorSelect: undefined;
  GeneratorForm: {
    type: QRType;
  };
  QRPreview: {
    type: QRType;
    data: string;
    title?: string;
    isSaved?: boolean;
    savedId?: string;
    customization?: QRCustomization;
    fileMeta?: import('./qr').UploadedFileMeta;
    isVerified?: boolean;
  };
  NetworkChecker: undefined;
  BarcodeGenerator: undefined;
};
