import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, Theme } from '@/theme/theme';

const THEME_KEY = 'infotess.theme';
type Mode = 'dark' | 'light' | 'system';

interface ThemeState {
  theme: Theme;
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeState>({
  theme: darkTheme,
  mode: 'dark',
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('dark');
  const [systemColor, setSystemColor] = useState(Appearance?.getColorScheme?.() ?? 'dark');

  // Listen to system color scheme changes
  useEffect(() => {
    const sub = Appearance?.addChangeListener?.(({ colorScheme }) => {
      if (colorScheme) setSystemColor(colorScheme);
    });
    return () => sub?.remove?.();
  }, []);

  // Load saved preference
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setModeState(saved);
        }
      } catch {}
    })();
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    AsyncStorage.setItem(THEME_KEY, m).catch(() => {});
  };

  const toggle = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  // Resolve effective theme
  const isDark = mode === 'system' ? systemColor === 'dark' : mode === 'dark';
  const resolvedTheme = isDark ? darkTheme : lightTheme;

  const value = useMemo<ThemeState>(
    () => ({ theme: resolvedTheme, mode, setMode, toggle }),
    [mode, systemColor]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useThemeContext = () => useContext(ThemeContext);
