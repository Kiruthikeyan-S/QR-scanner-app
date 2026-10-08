import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius, spacing } from '../theme/typography';
import { AppIcon } from '../components/AppIcon';
import { HistoryStorage } from '../storage/historyStorage';
import { ScanRecord } from '../types/qr';
import { QR_TYPES } from '../constants/config';
import { triggerLightHaptic } from '../utils/feedback';
import { ActionHandler } from '../utils/actionHandler';

import { NotificationModal } from '../components/NotificationModal';
import { NotificationStorage } from '../storage/notificationStorage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [recentScan, setRecentScan] = useState<ScanRecord | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [createMenuVisible, setCreateMenuVisible] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const loadData = async () => {
    const [history, unread] = await Promise.all([
      HistoryStorage.getAll(),
      NotificationStorage.getUnreadCount(),
    ]);
    if (history.length > 0) {
      setRecentScan(history[0]);
    } else {
      setRecentScan(null);
    }
    setUnreadNotifications(unread);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCopyRecent = async () => {
    if (!recentScan) return;
    triggerLightHaptic();
    await ActionHandler.copyToClipboard(recentScan.data);
  };

  const recentMeta = recentScan ? QR_TYPES[recentScan.type] || QR_TYPES.text : null;

  const handleCreateOption = (action: () => void) => {
    triggerLightHaptic();
    setCreateMenuVisible(false);
    setTimeout(() => {
      action();
    }, 150);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top App Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.appIcon, { backgroundColor: theme.primaryLight }]}>
            <AppIcon name="qr-code" size={20} color={theme.primary} />
          </View>
          <Text style={[styles.appTitle, { color: theme.text }]}>QR Smart</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Notification Bell */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              setNotificationModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.headerIconBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="notifications-outline" size={24} color={theme.text} />
            {unreadNotifications > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: palette.rose[500] }]}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </Pressable>

          {/* WhatsApp-style Standalone Plus Button */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              setCreateMenuVisible(true);
            }}
            style={({ pressed }) => [
              styles.headerIconBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="add" size={28} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Hero Greeting */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingTitle, { color: theme.text }]}>
            Welcome 👋
          </Text>
        </View>

        {/* Hero Card 1: SCAN QR CODE */}
        <Pressable
          onPress={() => {
            triggerLightHaptic();
            navigation.navigate('Scanner');
          }}
          style={({ pressed }) => [
            styles.heroCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.cardShadow,
              opacity: pressed ? 0.95 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}
        >
          <View
            style={[
              styles.heroIconCircle,
              { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : palette.emerald[50] },
            ]}
          >
            <AppIcon name="camera" size={28} color={palette.emerald[500]} />
          </View>

          <Text style={[styles.heroTitle, { color: theme.text }]}>Scan QR Code</Text>

          <View style={[styles.pillTagsRow, { borderTopColor: theme.borderLight }]}>
            <View style={styles.pillTag}>
              <AppIcon name="flash-outline" size={13} color={palette.emerald[600]} />
              <Text style={[styles.pillTagText, { color: theme.textSecondary }]}>High-Speed</Text>
            </View>
            <View style={styles.pillTag}>
              <AppIcon name="shield-checkmark-outline" size={13} color={palette.emerald[600]} />
              <Text style={[styles.pillTagText, { color: theme.textSecondary }]}>Safe Preview</Text>
            </View>
          </View>
        </Pressable>

        {/* Hero Card 2: GENERATE QR CODE */}
        <Pressable
          onPress={() => {
            triggerLightHaptic();
            navigation.navigate('GeneratorSelect');
          }}
          style={({ pressed }) => [
            styles.heroCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.cardShadow,
              opacity: pressed ? 0.95 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}
        >
          <View
            style={[
              styles.heroIconCircle,
              { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : palette.indigo[50] },
            ]}
          >
            <AppIcon name="qr-code-outline" size={28} color={palette.indigo[500]} />
          </View>

          <Text style={[styles.heroTitle, { color: theme.text }]}>Generate QR Code</Text>

          <View style={[styles.pillTagsRow, { borderTopColor: theme.borderLight }]}>
            <View style={styles.pillTag}>
              <AppIcon name="globe-outline" size={13} color={palette.indigo[500]} />
              <Text style={[styles.pillTagText, { color: theme.textSecondary }]}>URL</Text>
            </View>
            <View style={styles.pillTag}>
              <AppIcon name="wifi-outline" size={13} color={palette.indigo[500]} />
              <Text style={[styles.pillTagText, { color: theme.textSecondary }]}>Wi-Fi</Text>
            </View>
            <View style={styles.pillTag}>
              <AppIcon name="image-outline" size={13} color={palette.indigo[500]} />
              <Text style={[styles.pillTagText, { color: theme.textSecondary }]}>Photo</Text>
            </View>
          </View>
        </Pressable>

        {/* CREATE TOOLS Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>CREATE TOOLS</Text>
        </View>

        <View style={styles.toolsContainer}>
          {/* Row 1: 3 cards */}
          <View style={styles.toolsRow}>
            {/* Photo QR */}
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate('GeneratorForm', { type: 'photo' });
              }}
              style={({ pressed }) => [
                styles.toolCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : palette.emerald[50] }]}>
                <AppIcon name="image" size={22} color={palette.emerald[500]} />
              </View>
              <Text style={[styles.toolTitle, { color: theme.text }]}>Photo QR</Text>
            </Pressable>

            {/* PDF QR */}
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate('GeneratorForm', { type: 'file' });
              }}
              style={({ pressed }) => [
                styles.toolCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : palette.rose[50] }]}>
                <AppIcon name="document-text" size={22} color={palette.rose[500]} />
              </View>
              <Text style={[styles.toolTitle, { color: theme.text }]}>PDF QR</Text>
            </Pressable>

            {/* Barcode */}
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate('BarcodeGenerator');
              }}
              style={({ pressed }) => [
                styles.toolCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.18)' : palette.cyan[50] }]}>
                <AppIcon name="barcode" size={22} color={palette.cyan[500]} />
              </View>
              <Text style={[styles.toolTitle, { color: theme.text }]}>Barcode</Text>
            </Pressable>
          </View>

          {/* Row 2: 2 cards */}
          <View style={styles.toolsRow}>
            {/* Order ID */}
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate('GeneratorForm', { type: 'order_id' });
              }}
              style={({ pressed }) => [
                styles.toolCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : palette.amber[50] }]}>
                <AppIcon name="cube-outline" size={22} color={palette.amber[500]} />
              </View>
              <Text style={[styles.toolTitle, { color: theme.text }]}>Order ID</Text>
            </Pressable>

            {/* JSON */}
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate('GeneratorForm', { type: 'json' });
              }}
              style={({ pressed }) => [
                styles.toolCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : palette.indigo[50] }]}>
                <AppIcon name="code-slash-outline" size={22} color={palette.indigo[500]} />
              </View>
              <Text style={[styles.toolTitle, { color: theme.text }]}>JSON</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Actions Shortcuts */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              navigation.navigate('GeneratorSelect');
            }}
          >
            <Text style={[styles.sectionLink, { color: theme.primary }]}>View all</Text>
          </Pressable>
        </View>

        <View style={styles.quickActionsGrid}>
          {/* Quick Action 1: Wi-Fi Generator */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              navigation.navigate('GeneratorForm', { type: 'wifi' });
            }}
            style={({ pressed }) => [
              styles.quickActionCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: palette.indigo[50] }]}>
              <AppIcon name="wifi" size={20} color={palette.indigo[600]} />
            </View>
            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Share Wi-Fi</Text>
          </Pressable>

          {/* Quick Action 2: Website URL */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              navigation.navigate('GeneratorForm', { type: 'url' });
            }}
            style={({ pressed }) => [
              styles.quickActionCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: palette.emerald[50] }]}>
              <AppIcon name="globe" size={20} color={palette.emerald[600]} />
            </View>
            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Web Link</Text>
          </Pressable>

          {/* Quick Action 3: Network Checker */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              navigation.navigate('NetworkChecker');
            }}
            style={({ pressed }) => [
              styles.quickActionCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: palette.cyan[50] }]}>
              <AppIcon name="shield-checkmark" size={20} color={palette.cyan[600]} />
            </View>
            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Network Check</Text>
          </Pressable>
        </View>

        {/* Last Scanned Section */}
        {recentScan && recentMeta && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Last Scanned</Text>
              <Text style={[styles.timestampText, { color: theme.textMuted }]}>
                {new Date(recentScan.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate('ScanResult', {
                  data: recentScan.data,
                  type: recentScan.type,
                  scannedAt: recentScan.scanned_at,
                  fromHistoryId: recentScan.id,
                });
              }}
              style={({ pressed }) => [
                styles.recentCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={styles.recentLeft}>
                <View
                  style={[
                    styles.recentIcon,
                    {
                      backgroundColor: isDark ? recentMeta.badgeBgDark : recentMeta.badgeBgLight,
                    },
                  ]}
                >
                  <AppIcon
                    name={recentMeta.iconName}
                    size={20}
                    color={recentMeta.color}
                  />
                </View>
                <View style={styles.recentTextContainer}>
                  <Text style={[styles.recentType, { color: recentMeta.color }]}>
                    {recentMeta.label}
                  </Text>
                  <Text style={[styles.recentData, { color: theme.text }]} numberOfLines={1}>
                    {recentScan.data}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleCopyRecent}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.recentCopyBtn, { backgroundColor: theme.surfaceVariant }]}
              >
                <AppIcon name="copy-outline" size={16} color={theme.textSecondary} />
              </Pressable>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Notification Center Modal */}
      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => {
          setNotificationModalVisible(false);
          loadData();
        }}
      />

      {/* Create Action Menu / Bottom Sheet Modal */}
      <Modal
        visible={createMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCreateMenuVisible(false)}
        >
          <Pressable
            style={[
              styles.createSheet,
              {
                backgroundColor: theme.surface,
                paddingBottom: insets.bottom + spacing.lg,
                borderTopColor: theme.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <View style={styles.sheetHandleContainer}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            </View>

            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Create</Text>
              <Pressable
                onPress={() => setCreateMenuVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.sheetCloseBtn, { backgroundColor: theme.surfaceVariant }]}
              >
                <AppIcon name="close" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Options List */}
            <View style={styles.createOptionsList}>
              {/* 1. QR Code */}
              <Pressable
                onPress={() =>
                  handleCreateOption(() => navigation.navigate('GeneratorSelect'))
                }
                style={({ pressed }) => [
                  styles.createOptionRow,
                  {
                    backgroundColor: pressed ? theme.surfaceVariant : 'transparent',
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.createOptionIconBox,
                    { backgroundColor: palette.emerald[500] + '18' },
                  ]}
                >
                  <AppIcon name="qr-code" size={22} color={palette.emerald[500]} />
                </View>
                <Text style={[styles.createOptionTitle, { color: theme.text, flex: 1 }]}>
                  QR Code
                </Text>
                <AppIcon
                  name="chevron-forward"
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>

              {/* 2. Photo QR */}
              <Pressable
                onPress={() =>
                  handleCreateOption(() =>
                    navigation.navigate('GeneratorForm', { type: 'photo' })
                  )
                }
                style={({ pressed }) => [
                  styles.createOptionRow,
                  {
                    backgroundColor: pressed ? theme.surfaceVariant : 'transparent',
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.createOptionIconBox,
                    { backgroundColor: palette.cyan[500] + '18' },
                  ]}
                >
                  <AppIcon name="image" size={22} color={palette.cyan[500]} />
                </View>
                <Text style={[styles.createOptionTitle, { color: theme.text, flex: 1 }]}>
                  Photo QR
                </Text>
                <AppIcon
                  name="chevron-forward"
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>

              {/* 3. PDF QR */}
              <Pressable
                onPress={() =>
                  handleCreateOption(() =>
                    navigation.navigate('GeneratorForm', { type: 'file' })
                  )
                }
                style={({ pressed }) => [
                  styles.createOptionRow,
                  {
                    backgroundColor: pressed ? theme.surfaceVariant : 'transparent',
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.createOptionIconBox,
                    { backgroundColor: palette.rose[500] + '18' },
                  ]}
                >
                  <AppIcon name="document-text" size={22} color={palette.rose[500]} />
                </View>
                <Text style={[styles.createOptionTitle, { color: theme.text, flex: 1 }]}>
                  PDF QR
                </Text>
                <AppIcon
                  name="chevron-forward"
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>

              {/* 4. Order ID */}
              <Pressable
                onPress={() =>
                  handleCreateOption(() =>
                    navigation.navigate('GeneratorForm', { type: 'order_id' })
                  )
                }
                style={({ pressed }) => [
                  styles.createOptionRow,
                  {
                    backgroundColor: pressed ? theme.surfaceVariant : 'transparent',
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.createOptionIconBox,
                    { backgroundColor: palette.amber[500] + '18' },
                  ]}
                >
                  <AppIcon name="cube-outline" size={22} color={palette.amber[500]} />
                </View>
                <Text style={[styles.createOptionTitle, { color: theme.text, flex: 1 }]}>
                  Order ID
                </Text>
                <AppIcon
                  name="chevron-forward"
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>

              {/* 5. JSON */}
              <Pressable
                onPress={() =>
                  handleCreateOption(() =>
                    navigation.navigate('GeneratorForm', { type: 'json' })
                  )
                }
                style={({ pressed }) => [
                  styles.createOptionRow,
                  {
                    backgroundColor: pressed ? theme.surfaceVariant : 'transparent',
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.createOptionIconBox,
                    { backgroundColor: palette.indigo[500] + '18' },
                  ]}
                >
                  <AppIcon name="code-slash-outline" size={22} color={palette.indigo[500]} />
                </View>
                <Text style={[styles.createOptionTitle, { color: theme.text, flex: 1 }]}>
                  JSON
                </Text>
                <AppIcon
                  name="chevron-forward"
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>

              {/* 6. Barcode */}
              <Pressable
                onPress={() =>
                  handleCreateOption(() =>
                    navigation.navigate('BarcodeGenerator')
                  )
                }
                style={({ pressed }) => [
                  styles.createOptionRow,
                  {
                    backgroundColor: pressed ? theme.surfaceVariant : 'transparent',
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.createOptionIconBox,
                    { backgroundColor: palette.cyan[500] + '18' },
                  ]}
                >
                  <AppIcon name="barcode" size={22} color={palette.cyan[500]} />
                </View>
                <Text style={[styles.createOptionTitle, { color: theme.text, flex: 1 }]}>
                  Barcode
                </Text>
                <AppIcon
                  name="chevron-forward"
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  appTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 10,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  greetingSection: {
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  greetingTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.md,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  heroIconCircle: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs + 2,
  },
  heroTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  pillTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xs + 4,
    marginTop: spacing.xs + 2,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillTagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  sectionLink: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  timestampText: {
    fontSize: typography.fontSize.xs,
  },
  toolsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toolCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  toolTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  recentSection: {
    marginTop: spacing.xs,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentType: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  recentData: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  recentCopyBtn: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  /* Modal / Bottom Sheet Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  createSheet: {
    borderTopLeftRadius: borderRadius['2xl'] || 24,
    borderTopRightRadius: borderRadius['2xl'] || 24,
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    elevation: 20,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createOptionsList: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  createOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  createOptionIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  createOptionTextWrap: {
    flex: 1,
  },
  createOptionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  createOptionSub: {
    fontSize: typography.fontSize.xs,
  },
});
