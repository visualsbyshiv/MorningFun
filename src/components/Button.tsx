import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'success';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  icon,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 8, stiffness: 220 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 8, stiffness: 220 });
  };

  // Get color depending on variant
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return theme.primary;
      case 'secondary': return 'rgba(255, 255, 255, 0.15)';
      case 'accent': return theme.accent;
      case 'success': return '#00E676';
    }
  };

  const getTextColor = () => {
    if (variant === 'success') return '#111111';
    if (variant === 'secondary') return '#FFFFFF';
    return theme.buttonText;
  };

  const getShadowColor = () => {
    if (variant === 'secondary') return 'transparent';
    return variant === 'success' ? '#00E676' : theme.primary;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: getBackgroundColor(),
            shadowColor: getShadowColor(),
          },
          animatedStyle,
          style,
        ]}
      >
        {icon}
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 6px 10px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  text: {
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
