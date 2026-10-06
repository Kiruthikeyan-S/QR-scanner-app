import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const GeneratorSelectScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const typeList: QRTypeMetadata[] = Object.values(QR_TYPES);

  const handleSelectType = (type: QRType) => {
    navigation.navigate('GeneratorForm', { type });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title="Create QR Code"
          subtitle="Select format to generate"
          showBack
          onBack={() => navigation.goBack()}
        />
      </View>

      <FlatList
        data={typeList}
        keyExtractor={(item) => item.type}
        numColumns={2}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Choose QR Type</Text>
            <Text style={[styles.headerDesc, { color: theme.textSecondary }]}>
              Generate standard offline QR codes readable by any phone camera or scanner app.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <QRTypeCard item={item} onPress={() => handleSelectType(item.type)} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  headerArea: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  headerDesc: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
});
