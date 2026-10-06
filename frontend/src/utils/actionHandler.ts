import { Linking, Alert, Platform, Share } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';

export const ActionHandler = {
  async openUrl(url: string): Promise<boolean> {
    try {
      let targetUrl = url.trim();
      if (!/^https?:\/\//i.test(targetUrl) && !/^ftp:\/\//i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
      }

      const supported = await Linking.canOpenURL(targetUrl);
      if (supported) {
        await WebBrowser.openBrowserAsync(targetUrl);
        return true;
      } else {
        await Linking.openURL(targetUrl);
        return true;
      }
    } catch (e: any) {
      Alert.alert('Unable to Open Link', e.message || 'Could not open the specified web link.');
      return false;
    }
  },

  async callPhone(phoneNumber: string): Promise<boolean> {
    try {
      const clean = phoneNumber.replace(/[^0-9+]/g, '');
      const url = `tel:${clean}`;
      await Linking.openURL(url);
      return true;
    } catch (e: any) {
      Alert.alert('Unable to Call', 'Could not open the phone dialer on this device.');
      return false;
    }
  },

  async sendEmail(emailUrlOrAddress: string): Promise<boolean> {
    try {
      const url = emailUrlOrAddress.startsWith('mailto:') ? emailUrlOrAddress : `mailto:${emailUrlOrAddress}`;
      await Linking.openURL(url);
      return true;
    } catch (e: any) {
      Alert.alert('Unable to Open Mail', 'Could not open mail client on this device.');
      return false;
    }
  },

  async sendSMS(smsUrlOrPhone: string): Promise<boolean> {
    try {
      const url = smsUrlOrPhone.startsWith('sms:') || smsUrlOrPhone.startsWith('smsto:')
        ? smsUrlOrPhone.replace(/^smsto:/i, 'sms:')
        : `sms:${smsUrlOrPhone}`;
      await Linking.openURL(url);
      return true;
    } catch (e: any) {
      Alert.alert('Unable to Send SMS', 'Could not open SMS application.');
      return false;
    }
  },

  async openMap(geoCoordinates: string): Promise<boolean> {
    try {
      let cleanGeo = geoCoordinates.replace(/^geo:/i, '');
      const [coords] = cleanGeo.split('?');
      const [lat, lng] = coords.split(',');
      
      const scheme = Platform.select({
        ios: `maps:0,0?q=${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      });

      if (scheme) {
        await Linking.openURL(scheme);
        return true;
      }
      return false;
    } catch (e: any) {
      Alert.alert('Unable to Open Maps', 'Could not launch maps application.');
      return false;
    }
  },

  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await Clipboard.setStringAsync(text);
      return true;
    } catch (e) {
      return false;
    }
  },

  async shareText(title: string, message: string): Promise<boolean> {
    try {
      const result = await Share.share({
        title,
        message,
      });
      return result.action === Share.sharedAction;
    } catch (e: any) {
      Alert.alert('Share Failed', e.message || 'Could not share content.');
      return false;
    }
  },
};
