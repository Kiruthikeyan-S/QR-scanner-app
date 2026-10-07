import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { typography, borderRadius, spacing } from '../theme/typography';
import { AppIcon } from './AppIcon';
import { Badge } from './Badge';
import { NotificationStorage } from '../storage/notificationStorage';
import { AppNotification, NotificationType } from '../types/notification';
import { triggerLightHaptic } from '../utils/feedback';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onNotificationCountChange?: (count: number) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  onNotificationCountChange,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');

  const loadNotifications = async () => {
    const list = await NotificationStorage.getAll();
    setNotifications(list);
    const unreadCount = list.filter((n) => !n.read).length;
    onNotificationCountChange?.(unreadCount);
  };

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const handleMarkAllRead = async () => {
    triggerLightHaptic();
    await NotificationStorage.markAllAsRead();
    await loadNotifications();
  };

  const handleClearAll = async () => {
    triggerLightHaptic();
    await NotificationStorage.clearAll();
    await loadNotifications();
  };

  const handlePressItem = async (item: AppNotification) => {
    triggerLightHaptic();
    await NotificationStorage.markAsRead(item.id);
    await loadNotifications();

    if (item.actionRoute) {
      onClose();
      navigation.navigate(item.actionRoute, item.actionParams);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'scan':
        return { name: 'camera', color: theme.primary, bg: theme.primaryLight };
      case 'saved':
        return { name: 'bookmark', color: theme.secondary, bg: theme.secondaryLight };
      case 'network':
        return { name: 'wifi', color: theme.accent, bg: theme.accentLight };
      case 'system':
      default:
        return { name: 'shield-checkmark', color: theme.primary, bg: theme.surfaceVariant };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <Badge label={`${unreadCount} NEW`} variant="primary" size="sm" style={styles.newBadge} />
            )}
          </View>

          <View style={styles.headerRight}>
            {notifications.length > 0 && (
              <Pressable onPress={handleMarkAllRead} style={styles.headerActionBtn}>
                <Text style={[styles.headerActionText, { color: theme.primary }]}>Mark all read</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                onClose();
              }}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceVariant }]}
            >
              <AppIcon name="close" size={20} color={theme.text} />
            </Pressable>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={[styles.filterBar, { backgroundColor: theme.surface, borderBottomColor: theme.borderLight }]}>
          {(['all', 'unread', 'scan', 'saved', 'network'] as const).map((f) => {
            const isSelected = filter === f;
            const label = f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f === 'scan' ? 'Scans' : f === 'saved' ? 'Saved' : 'Network';
            return (
              <Pressable
                key={f}
                onPress={() => {
                  triggerLightHaptic();
                  setFilter(f);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surfaceVariant,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isSelected ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Notifications List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceVariant }]}>
                <AppIcon name="notifications-outline" size={36} color={theme.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Notifications</Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                Alerts for scans, saved QR codes, and system events will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const iconInfo = getIconForType(item.type);
            const timeAgo = new Date(item.timestamp).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Pressable
                onPress={() => handlePressItem(item)}
                style={({ pressed }) => [
                  styles.notifCard,
                  {
                    backgroundColor: item.read
                      ? theme.surface
                      : isDark
                      ? 'rgba(16, 185, 129, 0.08)'
                      : '#F0FDF4',
                    borderColor: item.read ? theme.border : theme.primaryLight,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View style={[styles.notifIcon, { backgroundColor: iconInfo.bg }]}>
                  <AppIcon name={iconInfo.name} size={20} color={iconInfo.color} />
                </View>

                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, { color: theme.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
                  </View>

                  <Text style={[styles.notifMessage, { color: theme.textSecondary }]} numberOfLines={3}>
                    {item.message}
                  </Text>

                  <Text style={[styles.notifTime, { color: theme.textMuted }]}>{timeAgo}</Text>
                </View>
              </Pressable>
            );
          }}
        />

        {notifications.length > 0 && (
          <View style={[styles.footerBar, { borderTopColor: theme.borderLight, backgroundColor: theme.surface }]}>
            <Pressable onPress={handleClearAll} style={styles.clearAllBtn}>
              <AppIcon name="trash-outline" size={15} color={theme.danger} style={{ marginRight: 4 }} />
              <Text style={[styles.clearAllText, { color: theme.danger }]}>Clear all notifications</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  newBadge: {
    marginLeft: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    marginRight: spacing.md,
  },
  headerActionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11,
  },
  listContent: {
    padding: spacing.lg,
  },
  notifCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 1,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  notifMessage: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    maxWidth: 260,
  },
  footerBar: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
