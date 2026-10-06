export const palette = {
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  cyan: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
  },
  rose: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    500: '#F43F5E',
    600: '#E11D48',
  },
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  white: '#FFFFFF',
  black: '#000000',
};

export interface ThemeColors {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceVariant: string;
  surfaceHighlight: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryContrast: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  secondaryContrast: string;
  accent: string;
  accentLight: string;
  success: string;
  warning: string;
  danger: string;
  cardShadow: string;
  overlay: string;
  navBackground: string;
  navBorder: string;
  inputBackground: string;
  inputBorder: string;
}

export const lightTheme: ThemeColors = {
  isDark: false,
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  surfaceHighlight: '#ECFDF5',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: palette.emerald[600],
  primaryLight: palette.emerald[50],
  primaryDark: palette.emerald[800],
  primaryContrast: '#FFFFFF',
  secondary: palette.indigo[600],
  secondaryLight: palette.indigo[50],
  secondaryDark: palette.indigo[800],
  secondaryContrast: '#FFFFFF',
  accent: palette.cyan[600],
  accentLight: palette.cyan[50],
  success: palette.emerald[500],
  warning: palette.amber[500],
  danger: palette.rose[500],
  cardShadow: 'rgba(15, 23, 42, 0.06)',
  overlay: 'rgba(15, 23, 42, 0.65)',
  navBackground: '#FFFFFF',
  navBorder: '#E2E8F0',
  inputBackground: '#F8FAFC',
  inputBorder: '#CBD5E1',
};

export const darkTheme: ThemeColors = {
  isDark: true,
  background: '#0B0F19',
  surface: '#151E2E',
  surfaceVariant: '#1E293B',
  surfaceHighlight: 'rgba(16, 185, 129, 0.12)',
  border: '#1E293B',
  borderLight: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: palette.emerald[500],
  primaryLight: 'rgba(16, 185, 129, 0.15)',
  primaryDark: palette.emerald[400],
  primaryContrast: '#FFFFFF',
  secondary: palette.indigo[400],
  secondaryLight: 'rgba(99, 102, 241, 0.15)',
  secondaryDark: palette.indigo[300],
  secondaryContrast: '#FFFFFF',
  accent: palette.cyan[400],
  accentLight: 'rgba(6, 182, 212, 0.15)',
  success: palette.emerald[400],
  warning: palette.amber[500],
  danger: palette.rose[500],
  cardShadow: 'rgba(0, 0, 0, 0.35)',
  overlay: 'rgba(0, 0, 0, 0.85)',
  navBackground: '#0F172A',
  navBorder: '#1E293B',
  inputBackground: '#1E293B',
  inputBorder: '#334155',
};
