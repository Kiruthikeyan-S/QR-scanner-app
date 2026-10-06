import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
import { typography, borderRadius, spacing } from '../theme/typography';
import { Badge } from '../components/Badge';
import { HistoryStorage } from '../storage/historyStorage';
import { ScanRecord } from '../types/qr';
import { QR_TYPES } from '../constants/config';
import { triggerLightHaptic } from '../utils/feedback';
import { ActionHandler } from '../utils/actionHandler';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [recentScan, setRecentScan] = useState<ScanRecord | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const history = await HistoryStorage.getAll();
    if (history.length > 0) {
      setRecentScan(history[0]);
    } else {
      setRecentScan(null);
    }
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
            <Ionicons name="qr-code" size={20} color={theme.primary} />
          </View>
          <Text style={[styles.appTitle, { color: theme.text }]}>QR Smart</Text>
          <Badge label="OFFLINE READY" variant="primary" size="sm" style={styles.headerBadge} />
        </View>

        <Pressable
          onPress={() => {
            triggerLightHaptic();
            navigation.navigate('GeneratorSelect');
          }}
          style={({ pressed }) => [
            styles.headerIconBtn,
            { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="add" size={22} color={theme.text} />
        </Pressable>
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
            What would you like to do?
          </Text>
          <Text style={[styles.greetingSubtitle, { color: theme.textSecondary }]}>
            Scan or generate high-accuracy QR codes instantly
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
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.heroIconCircle,
                { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : palette.emerald[50] },
              ]}
            >
              <Ionicons name="camera" size={28} color={palette.emerald[500]} />
            </View>
            <Badge label="INSTANT SCAN" variant="primary" size="sm" />
          </View>

          <Text style={[styles.heroTitle, { color: theme.text }]}>Scan QR Code</Text>
          <Text style={[styles.heroDescription, { color: theme.textSecondary }]}>
            Scan instantly from camera feed or pick an image from gallery
          </Text>

          <View style={[styles.pillTagsRow, { borderTopColor: theme.borderLight }]}>
            <View style={styles.pillTag}>
              <Ionicons name="flash-outline" size={13} color={palette.emerald[600]} />
              <Text style={[styles.pillTagText, { color: theme.textSecondary }]}>High-Speed</Text>
            </View>
            <View style={styles.pillTag}>
              <Ionicons name="shield-checkmark-outline" size={13} color={palette.emerald[600]} />
              <Text style={[styles.pillTagText, { color: theme.textSecondary }]}>Safe Preview</Text>
            </View>
            <View style={styles.pillTag}>
              <Ionicons name="cloud-offline-outline" size={13} color={palette.emerald[600]} />
              <Text style={[styles.pillTagText, { color: theme.textSecondary }]}>100% Offline</Text>
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
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.heroIconCircle,
                { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : palette.indigo[50] },
              ]}
            >
              <Ionicons name="qr-code-outline" size={28} color={palette.indigo[500]} />
            </View>
            <Badge label="CREATE NEW" variant="secondary" size="sm" />
          </View>

          <Text style={[styles.heroTitle, { color: theme.text }]}>Generate QR Code</Text>
          <Text style={[styles.heroDescription, { color: theme.textSecondary }]}>
            Create custom QR codes for Website URL, Wi-Fi, Contact, Text & more
          </Text>

          <View style={[styles.pillTagsRow, { borderTopColor: theme.borderLight }]}>
            <View style={styles.pillTag}>
              <Ionicons name="globe-outline" size={13} color={palette.indigo[500]} />
              <Text style={[styles.pillTagText, { color: theme.textSecondary }]}>URL</Text>
            </View>
            <View style={styles.pillTag}>
              <Ionicons name="wifi-outline" size={13} color={palette.indigo[500]} />
              <Text style={[styles.pillTagText, { color: theme.textSecondary }]}>Wi-Fi</Text>
            </View>
            <View style={styles.pillTag}>
              <Ionicons name="person-outline" size={13} color={palette.indigo[500]} />
              <Text style={[styles.pillTagText, { color: theme.textSecondary }]}>vCard</Text>
            </View>
            <View style={styles.pillTag}>
              <Ionicons name="location-outline" size={13} color={palette.indigo[500]} />
              <Text style={[styles.pillTagText, { color: theme.textSecondary }]}>Maps</Text>
            </View>
          </View>
        </Pressable>

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
              <Ionicons name="wifi" size={20} color={palette.indigo[600]} />
            </View>
            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Share Wi-Fi</Text>
            <Text style={[styles.quickActionSub, { color: theme.textSecondary }]}>Create code</Text>
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
              <Ionicons name="globe" size={20} color={palette.emerald[600]} />
            </View>
            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Web Link</Text>
            <Text style={[styles.quickActionSub, { color: theme.textSecondary }]}>URL code</Text>
          </Pressable>

          {/* Quick Action 3: Contact vCard */}
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              navigation.navigate('GeneratorForm', { type: 'contact' });
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
              <Ionicons name="person" size={20} color={palette.cyan[600]} />
            </View>
            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Contact</Text>
            <Text style={[styles.quickActionSub, { color: theme.textSecondary }]}>vCard code</Text>
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
                  <Ionicons
                    name={recentMeta.iconName as any}
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
                <Ionicons name="copy-outline" size={16} color={theme.textSecondary} />
              </Pressable>
            </Pressable>
          </View>
        )}
      </ScrollView>
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
    marginRight: spacing.sm,
  },
  headerBadge: {
    marginLeft: spacing.xs,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  greetingSection: {
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
  greetingTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  heroCard: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    marginBottom: spacing.base,
  },
  pillTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
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
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  sectionLink: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  timestampText: {
    fontSize: typography.fontSize.xs,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  quickIconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  quickActionSub: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
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
});
