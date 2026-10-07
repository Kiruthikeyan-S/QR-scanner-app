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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../theme/ThemeContext';
import { palette } from '../theme/colors';
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
  { label: 'Wi-Fi', value: 'wifi' },
  { label: 'Text', value: 'text' },
  { label: 'Contact', value: 'contact' },
  { label: 'Phone', value: 'phone' },
  { label: 'Email', value: 'email' },
  { label: 'Location', value: 'location' },
];

export const HistoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [filter, setFilter] = useState<'all' | QRType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Selection Mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadHistory = async () => {
    const list = await HistoryStorage.getAll();
    setHistory(list);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
      return () => {
        // Reset selection mode when navigating away
        setIsSelectionMode(false);
        setSelectedIds(new Set());
      };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleCardPress = (item: ScanRecord) => {
    if (isSelectionMode) {
      triggerLightHaptic();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        return next;
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

  const handleCardLongPress = (id: string) => {
    triggerLightHaptic();
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds(new Set([id]));
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }
  };

  const handleExitSelectionMode = () => {
    triggerLightHaptic();
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const message =
      count === 1
        ? 'Are you sure you want to delete 1 selected scan record?'
        : `Are you sure you want to delete ${count} selected scan records?`;

    Alert.alert('Delete Selected', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const idsToDelete = Array.from(selectedIds);
          await HistoryStorage.deleteMultiple(idsToDelete);
          setIsSelectionMode(false);
          setSelectedIds(new Set());
          await loadHistory();
          triggerFeedback();
        },
      },
    ]);
  };

  const filteredHistory = history.filter((item) => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.data.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Bar */}
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
          <View style={styles.selectionHeader}>
            <View style={styles.selectionLeft}>
              <Pressable
                onPress={handleExitSelectionMode}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
              <Text style={[styles.selectionTitle, { color: theme.text }]}>
                {selectedIds.size} Selected
              </Text>
            </View>

            {selectedIds.size > 0 && (
              <Pressable
                onPress={handleDeleteSelected}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(244, 63, 94, 0.18)'
                      : palette.rose[50],
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="trash-outline" size={16} color={palette.rose[500]} style={{ marginRight: 6 }} />
                <Text style={[styles.deleteBtnText, { color: palette.rose[500] }]}>Delete</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.normalHeader}>
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
            { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
          ]}
        >
          <Ionicons name="search" size={18} color={theme.textMuted} style={{ marginRight: spacing.sm }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search scan history..."
            placeholderTextColor={theme.textMuted}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
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
                onPress={() => {
                  triggerLightHaptic();
                  setFilter(item.value);
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
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No Scans Yet"
            description={
              searchQuery
                ? 'No history records match your search criteria.'
                : 'Scanned QR codes will automatically appear here with full history details.'
            }
            actionTitle="Scan a QR Code"
            onAction={() => navigation.navigate('Scanner')}
          />
        }
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.has(item.id)}
            onPress={() => handleCardPress(item)}
            onLongPress={() => handleCardLongPress(item.id)}
          />
        )}
      />
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
  normalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 36,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  selectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
  },
  deleteBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
