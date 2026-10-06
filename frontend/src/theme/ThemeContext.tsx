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
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    // Load stored preference
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeModeState(saved as ThemeMode);
      }
    }).catch(() => {});
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to save theme mode', e);
    }
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const isDark =
    themeMode === 'system'
      ? systemScheme === 'dark'
      : themeMode === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
