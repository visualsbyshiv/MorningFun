import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Compass, Users, Trophy, Sun, Moon, Brain, Zap } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

import { TodayTaskScreen } from '../screens/TodayTaskScreen';
import { AiCoachScreen } from '../screens/AiCoachScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { RewardScreen } from '../screens/RewardScreen';
import { BoostScreen } from '../screens/BoostScreen';

// -----------------------------------------------------------------------------
// Interactive Navigation Button Component with layout scaling springs
// -----------------------------------------------------------------------------
interface NavButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}

const TabButton: React.FC<NavButtonProps> = ({ label, isActive, onPress, icon }) => {
  const { theme } = useTheme();
  
  // Spring animated scale factor
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.12 : 1, { damping: 10, stiffness: 200 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.tabPressable}
    >
      <Animated.View
        style={[
          styles.tabButtonContainer,
          isActive ? { backgroundColor: 'rgba(255, 126, 95, 0.12)' } : null,
          animatedStyle,
        ]}
      >
        {icon}
        <Text
          numberOfLines={1}
          style={[
            styles.tabLabelText,
            { color: isActive ? theme.primary : '#8A8F9E' },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// -----------------------------------------------------------------------------
// Main BottomTab Shell
// -----------------------------------------------------------------------------
export const BottomTab: React.FC<{
  activeTab: 'today' | 'aicoach' | 'boost' | 'history' | 'leaderboard';
  setActiveTab: (tab: 'today' | 'aicoach' | 'boost' | 'history' | 'leaderboard') => void;
}> = ({ activeTab, setActiveTab }) => {
  const { theme, mode } = useTheme();

  const dockBg = mode === 'day' ? '#FFFFFF' : '#0B0D14';
  const dockBorder = mode === 'day' ? '#E2E8F0' : '#1D2230';
  const dockGradientColors = (mode === 'day' ? ['#FFFFFF', '#F8FAFC'] : ['#11141E', '#0B0D14']) as [string, string];

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'today': return <TodayTaskScreen />;
      case 'aicoach': return <AiCoachScreen />;
      case 'boost': return <BoostScreen />;
      case 'history': return <HistoryScreen />;
      case 'leaderboard': return <RewardScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Active screen window */}
      <View style={styles.body}>
        {renderActiveScreen()}
      </View>

      {/* Custom navigation dock using LinearGradient */}
      <SafeAreaView style={[styles.navDockSafeArea, { backgroundColor: dockBg, borderTopColor: dockBorder }]}>
        <LinearGradient
          colors={dockGradientColors}
          style={styles.gradientDock}
        >
          <TabButton
            label="Today's Task"
            isActive={activeTab === 'today'}
            onPress={() => setActiveTab('today')}
            icon={<Compass size={18} color={activeTab === 'today' ? theme.primary : '#8A8F9E'} />}
          />

          <TabButton
            label="AI Coach"
            isActive={activeTab === 'aicoach'}
            onPress={() => setActiveTab('aicoach')}
            icon={<Brain size={18} color={activeTab === 'aicoach' ? theme.primary : '#8A8F9E'} />}
          />

          <TabButton
            label="Boost"
            isActive={activeTab === 'boost'}
            onPress={() => setActiveTab('boost')}
            icon={<Zap size={18} color={activeTab === 'boost' ? theme.primary : '#8A8F9E'} />}
          />

          <TabButton
            label="History"
            isActive={activeTab === 'history'}
            onPress={() => setActiveTab('history')}
            icon={<Users size={18} color={activeTab === 'history' ? theme.primary : '#8A8F9E'} />}
          />

          <TabButton
            label="Leaderboard"
            isActive={activeTab === 'leaderboard'}
            onPress={() => setActiveTab('leaderboard')}
            icon={<Trophy size={18} color={activeTab === 'leaderboard' ? theme.primary : '#8A8F9E'} />}
          />
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  navDockSafeArea: {
    borderTopWidth: 1,
    borderTopColor: '#1d2230',
  },
  gradientDock: {
    flexDirection: 'row',
    height: 68,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 3,
    width: '98%',
  },
  tabLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  // ----------------------------------------------------
  // Screen Styles
  // ----------------------------------------------------
  screenCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0c0f16',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoCard: {
    width: width - 40,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    gap: 8,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  eggMock: {
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  eggText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eggSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionBtn: {
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  revealedMock: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  revealedEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  revealedTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  placeholderCard: {
    width: width - 40,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    gap: 16,
  },
  cardPlaceholderText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
export default BottomTab;
