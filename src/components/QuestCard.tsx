import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Task } from '../context/AppContext';

const { width } = Dimensions.get('window');

interface QuestCardProps {
  quest: Task;
  children?: React.ReactNode;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, children }) => {
  const { theme } = useTheme();

  // Animating shared values for scale and opacity on entrance
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 400 });
  }, [quest]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        },
        animatedStyle,
      ]}
    >
      {/* Dynamic top gradient accent banner */}
      <View style={[styles.accentBanner, { backgroundColor: theme.primary }]} />

      <View style={styles.header}>
        <Text style={[styles.difficulty, { color: theme.accent }]}>
          {quest.difficulty} QUEST
        </Text>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+{quest.xp} XP</Text>
        </View>
      </View>

      <Text style={styles.icon}>{quest.icon}</Text>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{quest.title}</Text>
      <Text style={[styles.desc, { color: theme.textSecondary }]}>{quest.desc}</Text>

      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width - 40,
    borderRadius: 30,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1)',
      },
    }),
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  accentBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  difficulty: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  xpBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  xpText: {
    color: '#00E676',
    fontWeight: 'bold',
    fontSize: 12,
  },
  icon: {
    fontSize: 64,
    marginVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 26,
  },
  desc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
});
