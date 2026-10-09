import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../theme/ThemeContext';
import { typography, borderRadius, spacing } from '../theme/typography';
import { SavedQRStorage } from '../storage/savedQRStorage';
import { SavedQRRecord } from '../types/qr';
import { QRCard } from '../components/QRCard';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { triggerFeedback, triggerLightHaptic } from '../utils/feedback';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SavedQRsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [savedList, setSavedList] = useState<SavedQRRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Rename modal states
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SavedQRRecord | null>(null);
  const [editName, setEditName] = useState('');

  const loadSavedQRs = async () => {
    const list = await SavedQRStorage.getAll();
    setSavedList(list);
  };

  useFocusEffect(
    useCallback(() => {
      loadSavedQRs();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedQRs();
    setRefreshing(false);
  };

  const handleDeleteItem = (id: string, name: string) => {
    Alert.alert('Delete QR Code', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await SavedQRStorage.delete(id);
          await loadSavedQRs();
          triggerLightHaptic();
        },
      },
    ]);
  };

  const handleOpenRename = (item: SavedQRRecord) => {
    setEditingItem(item);
    setEditName(item.name);
    setRenameModalVisible(true);
  };

  const handleSaveRename = async () => {
    if (!editingItem || !editName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a valid name.');
      return;
    }

    await SavedQRStorage.update(editingItem.id, { name: editName.trim() });
    setRenameModalVisible(false);
    setEditingItem(null);
    await loadSavedQRs();
    triggerFeedback();
  };

  const filteredList = savedList.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      item.data.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)
    );
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Saved QR Codes</Text>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
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
            placeholder="Search saved QR codes..."
            placeholderTextColor={theme.textMuted}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Saved List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 90 },
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
            icon="bookmark-outline"
            title="No Saved QR Codes"
            description={
              searchQuery
                ? 'No saved QR codes match your search query.'
                : 'Generated or favorite scanned QR codes can be saved here for instant offline access anytime.'
            }
            actionTitle="Create a QR Code"
            onAction={() => navigation.navigate('GeneratorSelect')}
          />
        }
        renderItem={({ item }) => (
          <QRCard
            item={item}
            onPress={() =>
              navigation.navigate('QRPreview', {
                type: item.type,
                data: item.data,
                title: item.name,
                isSaved: true,
                savedId: item.id,
              })
            }
            onDelete={() => handleDeleteItem(item.id, item.name)}
            onRename={() => handleOpenRename(item)}
          />
        )}
      />

      {/* WhatsApp-Style Floating Action Button */}
      <Pressable
        onPress={() => {
          triggerLightHaptic();
          navigation.navigate('GeneratorSelect');
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.primary,
            bottom: insets.bottom + 84,
            transform: [{ scale: pressed ? 0.92 : 1 }],
            shadowColor: isDark ? '#000000' : theme.primary,
          },
        ]}
        accessibilityLabel="Create QR Code"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Rename QR Code</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Enter a new name for this saved QR code.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Office Wi-Fi"
              placeholderTextColor={theme.textMuted}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <SecondaryButton
                title="Cancel"
                variant="ghost"
                onPress={() => setRenameModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Save Changes"
                onPress={handleSaveRename}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  searchContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
  },
  listContent: {
    padding: spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 18, // WhatsApp-style squircle / rounded-square
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 99,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    elevation: 5,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
