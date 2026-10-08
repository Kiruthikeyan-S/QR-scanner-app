export type NotificationType = 'scan' | 'saved' | 'network' | 'system' | 'alert';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRoute?: string;
  actionParams?: any;
  data?: any;
}

