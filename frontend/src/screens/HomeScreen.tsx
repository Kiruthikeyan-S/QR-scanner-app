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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  const getGreeting = () => {
    if (isFirstVisit) {
      return 'Welcome';
    }
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Hello';
  };

  const getGreetingSubtitle = () => {
    if (isFirstVisit) {
      return 'Scan, create and manage your QR codes easily';
    }
    return 'Scan or create QR codes anytime';
  };

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

    try {
      const hasVisited = await AsyncStorage.getItem('qr_smart_has_visited_home');
      if (!hasVisited) {
        setIsFirstVisit(true);
        await AsyncStorage.setItem('qr_smart_has_visited_home', 'true');
      } else {
        setIsFirstVisit(false);
      }
    } catch {}
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
            backgroundColor: '#FFFFFF',
            borderBottomColor: '#E2E8F0',
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.appIcon, { backgroundColor: palette.emerald[50] }]}>
            <AppIcon name="qr-code-outline" size={20} color="#059669" />
          </View>
          <Text style={[styles.appTitle, { color: '#0F172A' }]}>Qrinova</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Notification Icon */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              setNotificationModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.headerIconBtn,
              { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', opacity: pressed ? 0.7 : 1 },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="notifications-outline" size={22} color="#0F172A" />
            {unreadNotifications > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: palette.rose[500] }]}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
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
            tintColor="#059669"
            colors={['#059669']}
          />
        }
      >
        {/* SCANNER SECTION */}
        <Pressable
          onPress={() => {
            triggerLightHaptic();
            navigation.navigate('Scanner');
          }}
          style={({ pressed }) => [
            styles.scannerHeroCard,
            {
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              opacity: pressed ? 0.96 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}
        >
          <View style={styles.scannerHeroTop}>
            <View style={styles.scannerIconWrapper}>
              <AppIcon name="scan-outline" size={26} color="#059669" />
            </View>
            <Text style={[styles.scannerHeroTitle, { color: '#0F172A' }]}>
              Scan QR & Barcode
            </Text>
          </View>

          <View style={styles.scanNowBtn}>
            <AppIcon name="camera-outline" size={18} color="#FFFFFF" />
            <Text style={styles.scanNowBtnText}>Scan Now</Text>
          </View>
        </Pressable>

        {/* CREATE TOOLS Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: '#0F172A' }]}>CREATE TOOLS</Text>
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              navigation.navigate('GeneratorSelect');
            }}
          >
            <Text style={[styles.sectionLink, { color: '#059669' }]}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.toolsGrid}>
          {/* Row 1: 4 Tools */}
          <View style={styles.toolsRow}>
            {/* Video QR */}
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate('GeneratorForm', { type: 'video' });
              }}
              style={({ pressed }) => [
                styles.toolCard,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: palette.rose[50] }]}>
                <AppIcon name="videocam-outline" size={22} color={palette.rose[500]} />
              </View>
              <Text style={[styles.toolTitle, { color: '#0F172A' }]} numberOfLines={1}>Video QR</Text>
            </Pressable>

            {/* Audio QR */}
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate('GeneratorForm', { type: 'audio' });
              }}
              style={({ pressed }) => [
                styles.toolCard,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: palette.indigo[50] }]}>
                <AppIcon name="musical-notes-outline" size={22} color={palette.indigo[500]} />
              </View>
              <Text style={[styles.toolTitle, { color: '#0F172A' }]} numberOfLines={1}>Audio QR</Text>
            </Pressable>

            {/* Photo QR */}
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate('GeneratorForm', { type: 'photo' });
              }}
              style={({ pressed }) => [
                styles.toolCard,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: palette.emerald[50] }]}>
                <AppIcon name="image-outline" size={22} color="#059669" />
              </View>
              <Text style={[styles.toolTitle, { color: '#0F172A' }]} numberOfLines={1}>Photo QR</Text>
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
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: palette.cyan[50] }]}>
                <AppIcon name="document-text-outline" size={22} color={palette.cyan[600]} />
              </View>
              <Text style={[styles.toolTitle, { color: '#0F172A' }]} numberOfLines={1}>PDF QR</Text>
            </Pressable>
          </View>

          {/* Row 2: 4 Tools */}
          <View style={styles.toolsRow}>
            {/* Barcode */}
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate('BarcodeGenerator');
              }}
              style={({ pressed }) => [
                styles.toolCard,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: palette.blue[50] }]}>
                <AppIcon name="barcode-outline" size={22} color={palette.blue[600]} />
              </View>
              <Text style={[styles.toolTitle, { color: '#0F172A' }]} numberOfLines={1}>Barcode</Text>
            </Pressable>

            {/* Order ID */}
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate('GeneratorForm', { type: 'order_id' });
              }}
              style={({ pressed }) => [
                styles.toolCard,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: palette.amber[50] }]}>
                <AppIcon name="cube-outline" size={22} color={palette.amber[600]} />
              </View>
              <Text style={[styles.toolTitle, { color: '#0F172A' }]} numberOfLines={1}>Order ID</Text>
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
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: palette.violet[50] }]}>
                <AppIcon name="code-slash-outline" size={22} color={palette.violet[500]} />
              </View>
              <Text style={[styles.toolTitle, { color: '#0F172A' }]} numberOfLines={1}>JSON</Text>
            </Pressable>

            {/* Share Wi-Fi */}
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate('GeneratorForm', { type: 'wifi' });
              }}
              style={({ pressed }) => [
                styles.toolCard,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: palette.teal[50] }]}>
                <AppIcon name="wifi-outline" size={22} color={palette.teal[600]} />
              </View>
              <Text style={[styles.toolTitle, { color: '#0F172A' }]} numberOfLines={1}>Wi-Fi</Text>
            </Pressable>
          </View>
        </View>

        {/* QUICK SHORTCUTS Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: '#0F172A' }]}>QUICK SHORTCUTS</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          {/* Quick Action 1: Website URL */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              navigation.navigate('GeneratorForm', { type: 'url' });
            }}
            style={({ pressed }) => [
              styles.quickActionCard,
              {
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: palette.emerald[50] }]}>
              <AppIcon name="globe-outline" size={20} color="#059669" />
            </View>
            <Text style={[styles.quickActionLabel, { color: '#0F172A' }]}>Web Link</Text>
          </Pressable>

          {/* Quick Action 2: Wi-Fi */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              navigation.navigate('GeneratorForm', { type: 'wifi' });
            }}
            style={({ pressed }) => [
              styles.quickActionCard,
              {
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: palette.indigo[50] }]}>
              <AppIcon name="wifi-outline" size={20} color={palette.indigo[600]} />
            </View>
            <Text style={[styles.quickActionLabel, { color: '#0F172A' }]}>Wi-Fi</Text>
          </Pressable>

          {/* Quick Action 3: Contact */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              navigation.navigate('GeneratorForm', { type: 'contact' });
            }}
            style={({ pressed }) => [
              styles.quickActionCard,
              {
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: palette.blue[50] }]}>
              <AppIcon name="person-outline" size={20} color={palette.blue[600]} />
            </View>
            <Text style={[styles.quickActionLabel, { color: '#0F172A' }]}>Contact</Text>
          </Pressable>

          {/* Quick Action 4: Phone */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              navigation.navigate('GeneratorForm', { type: 'phone' });
            }}
            style={({ pressed }) => [
              styles.quickActionCard,
              {
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: palette.cyan[50] }]}>
              <AppIcon name="call-outline" size={20} color={palette.cyan[600]} />
            </View>
            <Text style={[styles.quickActionLabel, { color: '#0F172A' }]}>Phone</Text>
          </Pressable>
        </View>

        {/* RECENT ACTIVITY Section */}
        {recentScan && recentMeta && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: '#0F172A' }]}>RECENT ACTIVITY</Text>
              <Text style={[styles.timestampText, { color: '#94A3B8' }]}>
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
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  opacity: pressed ? 0.95 : 1,
                },
              ]}
            >
              <View style={styles.recentLeft}>
                <View
                  style={[
                    styles.recentIcon,
                    {
                      backgroundColor: recentMeta.badgeBgLight,
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
                  <Text style={[styles.recentData, { color: '#0F172A' }]} numberOfLines={1}>
                    {recentScan.data}
                  </Text>
                </View>
              </View>

              <View style={styles.recentActionsRow}>
                <Pressable
                  onPress={handleCopyRecent}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={({ pressed }) => [
                    styles.recentActionBtn,
                    { backgroundColor: '#F8FAFC', opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <AppIcon name="copy-outline" size={16} color="#64748B" />
                </Pressable>
                <View style={styles.recentChevronBox}>
                  <AppIcon name="chevron-forward" size={18} color="#94A3B8" />
                </View>
              </View>
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

              {/* 3b. Video QR */}
              <Pressable
                onPress={() =>
                  handleCreateOption(() =>
                    navigation.navigate('GeneratorForm', { type: 'video' })
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
                  <AppIcon name="videocam-outline" size={22} color={palette.rose[500]} />
                </View>
                <Text style={[styles.createOptionTitle, { color: theme.text, flex: 1 }]}>
                  Video QR
                </Text>
                <AppIcon
                  name="chevron-forward"
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>

              {/* 3c. Audio QR */}
              <Pressable
                onPress={() =>
                  handleCreateOption(() =>
                    navigation.navigate('GeneratorForm', { type: 'audio' })
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
                  <AppIcon name="musical-notes-outline" size={22} color={palette.indigo[500]} />
                </View>
                <Text style={[styles.createOptionTitle, { color: theme.text, flex: 1 }]}>
                  Audio QR
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
    lineHeight: 22,
  },
  appSubtitle: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: typography.fontWeight.medium,
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
  greetingSubtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
    fontWeight: typography.fontWeight.medium,
  },
  scannerHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.md,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  scannerHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  scannerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scannerHeroTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  scanNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
  },
  scanNowBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.8,
  },
  sectionLink: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  timestampText: {
    fontSize: typography.fontSize.xs,
  },
  toolsGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  toolCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  toolIconBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  toolTitle: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: 11,
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
  recentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: spacing.sm,
  },
  recentActionBtn: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recentChevronBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
