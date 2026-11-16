import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, lightTheme, darkTheme } from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  themeMode: 'system',
  setThemeMode: () => {},
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = '@qr_smart_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pure modern Light Theme design system
  const theme = lightTheme;
  const isDark = false;
  const themeMode: ThemeMode = 'light';

  const setThemeMode = async (_mode: ThemeMode) => {};
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
