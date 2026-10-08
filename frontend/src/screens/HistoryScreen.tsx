import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  Pressable,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../theme/ThemeContext';
import { typography, borderRadius, spacing } from '../theme/typography';
import { HistoryStorage } from '../storage/historyStorage';
import { ScanRecord, QRType } from '../types/qr';
import { HistoryCard } from '../components/HistoryCard';
import { EmptyState } from '../components/EmptyState';
import { triggerFeedback, triggerLightHaptic } from '../utils/feedback';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FILTER_OPTIONS: { label: string; value: 'all' | QRType }[] = [
  { label: 'All', value: 'all' },
  { label: 'URL', value: 'url' },
  { label: 'Order ID', value: 'order_id' },
  { label: 'JSON', value: 'json' },
  { label: 'Photo', value: 'photo' },
  { label: 'Wi-Fi', value: 'wifi' },
  { label: 'Text', value: 'text' },
  { label: 'Contact', value: 'contact' },
  { label: 'Phone', value: 'phone' },
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Location', value: 'location' },
  { label: 'Barcode', value: 'barcode' },
];

export const HistoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [filter, setFilter] = useState<'all' | QRType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedToast, setCopiedToast] = useState(false);

  const loadHistory = async () => {
    const list = await HistoryStorage.getAll();
    setHistory(list);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
      // Clear selection mode on screen refocus
      setIsSelectionMode(false);
      setSelectedIds([]);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  // Exit Selection Mode
  const exitSelectionMode = () => {
    triggerLightHaptic();
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  // Card Long Press: Enters Selection Mode
  const handleCardLongPress = (id: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds([id]);
      triggerLightHaptic();
    }
  };

  // Card Tap Handler
  const handleCardPress = (item: ScanRecord) => {
    if (isSelectionMode) {
      triggerLightHaptic();
      setSelectedIds((prev) => {
        let updated: string[];
        if (prev.includes(item.id)) {
          updated = prev.filter((id) => id !== item.id);
        } else {
          updated = [...prev, item.id];
        }

        // Auto exit if zero items selected
        if (updated.length === 0) {
          setIsSelectionMode(false);
        }
        return updated;
      });
    } else {
      triggerLightHaptic();
      navigation.navigate('ScanResult', {
        data: item.data,
        type: item.type,
        scannedAt: item.scanned_at,
        fromHistoryId: item.id,
      });
    }
  };

  // Single Item Delete (Normal Mode)
  const handleDeleteSingle = (id: string) => {
    Alert.alert(
      'Delete history item?',
      'Are you sure you want to delete this scan from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await HistoryStorage.delete(id);
            await loadHistory();
            triggerLightHaptic();
          },
        },
      ]
    );
  };

  // Batch Delete (Selection Mode)
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const title = count === 1 ? 'Delete selected item?' : `Delete ${count} selected history items?`;
    const message =
      count === 1
        ? 'Are you sure you want to delete this scan from history?'
        : `Are you sure you want to delete these ${count} scans from history?`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await HistoryStorage.deleteMultiple(selectedIds);
          setSelectedIds([]);
          setIsSelectionMode(false);
          await loadHistory();
          triggerFeedback();
        },
      },
    ]);
  };

  const handleCopySuccess = () => {
    setCopiedToast(true);
    setTimeout(() => {
      setCopiedToast(false);
    }, 1800);
  };

  // Filtered History
  const filteredHistory = history.filter((item) => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.data.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesFilter && matchesSearch;
  });

  const renderEmptyComponent = () => {
    if (history.length === 0) {
      return (
        <EmptyState
          icon="time-outline"
          title="No scan history yet"
          description="Scan a QR code or barcode and your recent scans will appear here."
          actionTitle="Scan Now"
          onAction={() => navigation.navigate('Scanner')}
        />
      );
    }

    if (searchQuery.trim().length > 0) {
      return (
        <EmptyState
          icon="search-outline"
          title="No matching history found"
          description="Try another search."
        />
      );
    }

    if (filter !== 'all') {
      const filterMeta = FILTER_OPTIONS.find((f) => f.value === filter);
      const filterLabel = filterMeta ? filterMeta.label : filter;
      return (
        <EmptyState
          icon="funnel-outline"
          title={`No ${filterLabel} scan history found`}
          description={`No scanned records match the ${filterLabel} category.`}
        />
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Dynamic Header: Normal vs Selection Mode */}
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
        {isSelectionMode ? (
          <View style={styles.selectionHeaderRow}>
            <Pressable
              onPress={exitSelectionMode}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.headerActionBtn,
                { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityLabel="Close selection mode"
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>

            <Text style={[styles.selectionTitle, { color: theme.text }]}>
              {selectedIds.length} Selected
            </Text>

            <Pressable
              onPress={handleBatchDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.headerActionBtn,
                { backgroundColor: 'rgba(239, 68, 68, 0.1)', opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityLabel="Delete selected items"
            >
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.normalHeaderRow}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Scan History</Text>
          </View>
        )}
      </View>

      {/* Search and Filters */}
      <View style={[styles.controlsSection, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              opacity: isSelectionMode ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={theme.textMuted} style={{ marginRight: spacing.sm }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search scan history..."
            placeholderTextColor={theme.textMuted}
            editable={!isSelectionMode}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && !isSelectionMode && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter Chips Horizontal Scroll */}
        <FlatList
          horizontal
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = filter === item.value;
            return (
              <Pressable
                disabled={isSelectionMode}
                onPress={() => {
                  triggerLightHaptic();
                  setFilter(item.value);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surfaceVariant,
                    borderColor: isSelected ? theme.primary : theme.border,
                    opacity: isSelectionMode ? 0.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isSelected ? typography.fontWeight.bold : typography.fontWeight.medium,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* History List */}
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
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
        ListEmptyComponent={renderEmptyComponent}
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            isSelected={selectedIds.includes(item.id)}
            isSelectionMode={isSelectionMode}
            onPress={() => handleCardPress(item)}
            onLongPress={() => handleCardLongPress(item.id)}
            onDelete={() => handleDeleteSingle(item.id)}
            onCopySuccess={handleCopySuccess}
          />
        )}
      />

      {/* Copied Toast Banner */}
      {copiedToast && (
        <View
          style={[
            styles.toastBanner,
            {
              backgroundColor: isDark ? '#1E293B' : '#0F172A',
              bottom: insets.bottom + 90,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>Copied to clipboard</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  normalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
  },
  selectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 38,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  selectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsSection: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  filterChipText: {
    fontSize: typography.fontSize.xs,
  },
  listContent: {
    padding: spacing.lg,
  },
  toastBanner: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
