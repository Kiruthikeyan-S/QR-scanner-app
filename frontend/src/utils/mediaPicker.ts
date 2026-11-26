import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { triggerLightHaptic } from './feedback';

export type MediaQRType = 'photo' | 'video' | 'audio' | 'file';

export interface PickedMediaFile {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
  duration?: number;
}

export const isMediaQRType = (type: string): type is MediaQRType => {
  return type === 'photo' || type === 'video' || type === 'audio' || type === 'file';
};

export const pickMediaForQRType = async (
  type: MediaQRType
): Promise<PickedMediaFile | null> => {
  try {
    triggerLightHaptic();

    if (type === 'photo') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const name = asset.fileName || `photo_${Date.now()}.jpg`;
      const size = asset.fileSize || 1024 * 500;
      const mimeType = asset.mimeType || 'image/jpeg';

      if (size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Photos must be 10 MB or smaller.');
        return null;
      }

      return { uri: asset.uri, name, size, mimeType };
    }

    if (type === 'video') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const name = asset.fileName || `video_${Date.now()}.mp4`;
      const size = asset.fileSize || 0;
      const mimeType = asset.mimeType || 'video/mp4';

      if (size > 50 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Videos must be 50 MB or smaller.');
        return null;
      }

      return {
        uri: asset.uri,
        name,
        size,
        mimeType,
        duration: asset.duration || undefined,
      };
    }

    if (type === 'audio') {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const size = asset.size || 0;
      const name = asset.name || 'audio.mp3';

      if (size > 25 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Audio files must be 25 MB or smaller.');
        return null;
      }

      return {
        uri: asset.uri,
        name,
        size,
        mimeType: asset.mimeType || 'audio/mpeg',
      };
    }

    // type === 'file' (PDF / Document)
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/*', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const size = asset.size || 0;
    const name = asset.name || 'document.pdf';

    if (size > 25 * 1024 * 1024) {
      Alert.alert('File Too Large', 'PDF files must be 25 MB or smaller.');
      return null;
    }

    return {
      uri: asset.uri,
      name,
      size,
      mimeType: asset.mimeType || 'application/pdf',
    };
  } catch (e: any) {
    Alert.alert('Picker Error', e?.message || 'Failed to select file.');
    return null;
  }
};
