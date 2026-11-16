import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryStorage } from '../storage/historyStorage';
import { SavedQRStorage } from '../storage/savedQRStorage';

const NOTIF_PREFS_KEY = '@qrinova_notification_preferences_v1';
const WEEKLY_NOTIFICATION_ID = 'qrinova_weekly_reminder';

export interface NotificationPreferences {
  enabled: boolean;
  dayOfWeek: number; // 1 = Sunday in expo-notifications
  hour: number;      // 10 AM
  minute: number;    // 0
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: false,
  dayOfWeek: 1, // Sunday
  hour: 10,
  minute: 0,
};

// Configure local presentation handler safely
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {}

export const NotificationService = {
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const data = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
      if (data) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(data) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PREFERENCES;
  },

  async savePreferences(prefs: NotificationPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('[NotificationService] Failed to save preferences', e);
    }
  },

  async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  },

  async requestPermission(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
      return false;
    }

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('weekly_reminders', {
          name: 'Weekly Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#059669',
        });
      } catch (channelErr) {
        // In Expo Go or devices without channel provider, channel creation can be safely skipped
        console.warn('[NotificationService] Android channel setup skipped:', channelErr);
      }
    }

    return true;
  },

  async scheduleWeeklyNotification(): Promise<boolean> {
    const granted = await this.requestPermission();
    if (!granted) return false;

    // Cancel any existing scheduled weekly notifications to prevent duplicates
    await this.cancelWeeklyNotification();

    // Prepare weekly summary stats from real AsyncStorage records
    let summaryText = 'Have you scanned or created your QR codes this week? Open Qrinova and make things easier!';
    try {
      const history = await HistoryStorage.getAll();
      const saved = await SavedQRStorage.getAll();
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      const recentScans = history.filter(h => new Date(h.scanned_at).getTime() >= oneWeekAgo);
      const recentSaved = saved.filter(s => new Date(s.created_at).getTime() >= oneWeekAgo);

      const qrScans = recentScans.filter(s => s.type !== 'barcode').length;
      const barcodeScans = recentScans.filter(s => s.type === 'barcode').length;
      const createdQrs = recentSaved.length;

      if (recentScans.length > 0 || recentSaved.length > 0) {
        summaryText = `This week: ${qrScans} QR(s) scanned, ${barcodeScans} barcode(s), and ${createdQrs} created!`;
      }
    } catch {
      // Use standard default reminder
    }

    // Schedule: Weekly on Sunday at 10:00 AM local device time
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: WEEKLY_NOTIFICATION_ID,
        content: {
          title: 'Your weekly Qrinova reminder!',
          body: summaryText,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1, // Sunday (1 = Sunday in Expo)
          hour: 10,
          minute: 0,
          channelId: Platform.OS === 'android' ? 'weekly_reminders' : undefined,
        },
      });
    } catch (schedErr) {
      console.warn('[NotificationService] Schedule notification error:', schedErr);
    }

    await this.savePreferences({
      enabled: true,
      dayOfWeek: 1,
      hour: 10,
      minute: 0,
    });

    return true;
  },

  async cancelWeeklyNotification(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(WEEKLY_NOTIFICATION_ID);
    } catch {
      // Ignore if not scheduled
    }

    const current = await this.getPreferences();
    await this.savePreferences({ ...current, enabled: false });
  },

  /**
   * Temporary 1-minute notification test during development.
   */
  async scheduleDevTestNotification(): Promise<boolean> {
    const granted = await this.requestPermission();
    if (!granted) return false;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Qrinova Test Notification',
          body: 'Success! Qrinova notifications are configured and functioning properly.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 60,
          repeats: false,
        },
      });
      return true;
    } catch (testErr) {
      console.warn('[NotificationService] Test notification error:', testErr);
      return false;
    }
  },
};
