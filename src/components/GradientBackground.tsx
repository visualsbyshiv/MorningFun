import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export const GradientBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode, theme } = useTheme();

  const colorsList = mode === 'day' 
    ? [theme.backgroundStart, theme.backgroundEnd] 
    : [theme.backgroundStart, '#1F1C2C', theme.backgroundEnd];

  return (
    <LinearGradient
      colors={colorsList as [string, string, ...string[]]}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 0.9 }}
      style={styles.gradient}
    >
      <View style={styles.overlay}>
        {children}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  }
});
