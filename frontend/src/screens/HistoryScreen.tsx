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
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [filter, setFilter] = useState<'all' | QRType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    const list = await HistoryStorage.getAll();
    setHistory(list);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      'Delete Scan Record',
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

  const handleClearAll = () => {
    if (history.length === 0) return;
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all scan history records? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await HistoryStorage.clearAll();
            await loadHistory();
            triggerFeedback();
          },
        },
      ]
    );
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
      {/* Header */}
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Scan History</Text>
          <Text style={[styles.headerCount, { color: theme.textSecondary }]}>
            ({history.length})
          </Text>
        </View>

        {history.length > 0 && (
          <Pressable
            onPress={handleClearAll}
            style={({ pressed }) => [
              styles.clearBtn,
              { backgroundColor: 'rgba(239, 68, 68, 0.1)', opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color={theme.danger} style={{ marginRight: 4 }} />
            <Text style={[styles.clearBtnText, { color: theme.danger }]}>Clear All</Text>
          </Pressable>
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
            onPress={() =>
              navigation.navigate('ScanResult', {
                data: item.data,
                type: item.type,
                scannedAt: item.scanned_at,
                fromHistoryId: item.id,
              })
            }
            onDelete={() => handleDeleteItem(item.id)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  headerCount: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  clearBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
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
});
