import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNotification } from '../types/notification';

const NOTIFICATIONS_STORAGE_KEY = '@qr_smart_notifications_v1';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'welcome-1',
    type: 'system',
    title: 'Welcome to QR Smart',
    message: 'Your high-accuracy offline QR scanner and generator is ready to use.',
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: 'offline-engine-2',
    type: 'network',
    title: 'Offline Engine Active',
    message: 'You can scan and generate QR codes even with no internet connection.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
];

export const NotificationStorage = {
  async getAll(): Promise<AppNotification[]> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (!data) {
        await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
        return INITIAL_NOTIFICATIONS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
    } catch (e) {
      return INITIAL_NOTIFICATIONS;
    }
  },

  async add(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): Promise<AppNotification> {
    try {
      const list = await this.getAll();
      const newNotif: AppNotification = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: new Date().toISOString(),
        read: false,
        actionRoute: notification.actionRoute,
        actionParams: notification.actionParams,
        data: notification.data,
      };

      const updated = [newNotif, ...list];
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      return newNotif;
    } catch (e) {
      return {
        id: Date.now().toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: new Date().toISOString(),
        read: false,
      };
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const list = await this.getAll();
      return list.filter((item) => !item.read).length;
    } catch (e) {
      return 0;
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      const list = await this.getAll();
      const updated = list.map((item) => (item.id === id ? { ...item, read: true } : item));
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  },

  async markAllAsRead(): Promise<void> {
    try {
      const list = await this.getAll();
      const updated = list.map((item) => ({ ...item, read: true }));
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {}
  },
};
