import React, { createContext, useContext, useState, useEffect } from 'react';
import { colors, ThemeColors } from '../theme/colors';

type ThemeMode = 'day' | 'night';

interface ThemeContextType {
  mode: ThemeMode;
  theme: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('day');

  const toggleTheme = () => {
    setMode((prev) => (prev === 'day' ? 'night' : 'day'));
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const currentTheme = mode === 'day' ? colors.day : colors.night;

  return (
    <ThemeContext.Provider value={{ mode, theme: currentTheme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
