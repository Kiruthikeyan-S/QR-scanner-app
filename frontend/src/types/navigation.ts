import { NavigatorScreenParams } from '@react-navigation/native';
import { QRType, ScanRecord, SavedQRRecord } from './qr';

export type MainTabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
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
  };
  NetworkChecker: undefined;
};
