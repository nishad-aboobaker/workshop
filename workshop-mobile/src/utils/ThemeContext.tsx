import React, { createContext, useContext, useState, ReactNode } from 'react';
import { setSetting } from '../database/database';

export type ThemeType = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  cardBg: string;
  cardBgElevated: string;
  border: string;
  textDark: string;
  textMuted: string;
  primary: string;
  success: string;
  danger: string;
  white: string;
}

export const lightTheme: ThemeColors = {
  bg: '#f8fafc',
  cardBg: '#ffffff',
  cardBgElevated: '#f1f5f9',
  border: '#e2e8f0',
  textDark: '#0f172a',
  textMuted: '#64748b',
  primary: '#0ea5e9',
  success: '#10b981',
  danger: '#ef4444',
  white: '#ffffff',
};

export const darkTheme: ThemeColors = {
  bg: '#0f172a',
  cardBg: '#1e293b',
  cardBgElevated: '#334155',
  border: '#334155',
  textDark: '#f8fafc',
  textMuted: '#94a3b8',
  primary: '#0ea5e9',
  success: '#10b981',
  danger: '#ef4444',
  white: '#ffffff',
};

interface ThemeContextProps {
  theme: ThemeType;
  Colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'dark',
  Colors: darkTheme,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = '@app_theme_pref';

export const ThemeProvider = ({ children, initialTheme = 'dark' }: { children: ReactNode, initialTheme?: 'dark' | 'light' }) => {
  const [theme, setTheme] = useState<ThemeType>(initialTheme);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      setSetting('theme', newTheme).catch(console.error);
      return newTheme;
    });
  };

  const Colors = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, Colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
