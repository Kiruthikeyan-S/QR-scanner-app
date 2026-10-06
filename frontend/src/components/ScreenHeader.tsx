import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../theme/typography';
import { triggerLightHaptic } from '../utils/feedback';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color?: string;
  };
  style?: ViewStyle;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  style,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const handleBack = () => {
    triggerLightHaptic();
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }, style]}>
      <View style={styles.leftContainer}>
        {showBack && (
          <Pressable
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightAction && (
        <Pressable
          onPress={() => {
            triggerLightHaptic();
            rightAction.onPress();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons
            name={rightAction.icon}
            size={20}
            color={rightAction.color || theme.text}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
});
