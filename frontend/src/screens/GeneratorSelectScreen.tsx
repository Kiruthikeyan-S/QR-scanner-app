import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { QR_TYPES, QRTypeMetadata } from '../constants/config';
import { QRTypeCard } from '../components/QRTypeCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme } from '../theme/ThemeContext';
import { typography, spacing } from '../theme/typography';
import { QRType } from '../types/qr';
import { isMediaQRType, pickMediaForQRType } from '../utils/mediaPicker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CategoryGroup {
  title: string;
  subtitle: string;
  types: QRType[];
}

export const GeneratorSelectScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const handleSelectType = async (type: QRType) => {
    if (isMediaQRType(type)) {
      const picked = await pickMediaForQRType(type);
      if (picked) {
        navigation.navigate('GeneratorForm', { type, initialMedia: picked });
      }
      return;
    }
    navigation.navigate('GeneratorForm', { type });
  };

  const categories: CategoryGroup[] = [
    {
      title: 'Basic',
      subtitle: 'Standard quick connection codes',
      types: ['url', 'wifi', 'text', 'phone', 'email', 'sms'],
    },
    {
      title: 'Media & Files',
      subtitle: 'Direct cloud share with instant preview',
      types: ['video', 'audio', 'photo', 'file'],
    },
    {
      title: 'Personal',
      subtitle: 'Share your identity and location',
      types: ['contact', 'location'],
    },
    {
      title: 'Business & Data',
      subtitle: 'Structured enterprise data formats',
      types: ['order_id', 'json'],
    },
  ];

  const renderGrid = (types: QRType[]) => {
    const rows: QRType[][] = [];
    for (let i = 0; i < types.length; i += 2) {
      rows.push(types.slice(i, i + 2));
    }

    return (
      <View style={styles.gridContainer}>
        {rows.map((row, rIndex) => (
          <View key={`row-${rIndex}`} style={styles.gridRow}>
            {row.map((t) => {
              const meta = QR_TYPES[t];
              if (!meta) return null;
              return (
                <QRTypeCard
                  key={t}
                  item={meta}
                  onPress={() => handleSelectType(t)}
                />
              );
            })}
            {/* If odd number in row, add empty spacer */}
            {row.length === 1 && <View style={styles.spacerCard} />}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ paddingTop: insets.top, backgroundColor: theme.surface }}>
        <ScreenHeader
          title="Create QR Code"
          showBack
          onBack={() => navigation.goBack()}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((category) => (
          <View key={category.title} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, { color: theme.text }]}>
                {category.title}
              </Text>
            </View>

            {renderGrid(category.types)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  categoryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  categorySubtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  gridContainer: {
    gap: spacing.xs,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  spacerCard: {
    flex: 1,
    margin: spacing.xs,
  },
});
