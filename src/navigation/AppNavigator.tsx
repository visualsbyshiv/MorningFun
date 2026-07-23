import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView } from 'react-native';
import { Compass, Users, Trophy } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { TodayTaskScreen } from '../screens/TodayTaskScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { RewardScreen } from '../screens/RewardScreen';

type ScreenName = 'TODAY_TASK' | 'HISTORY' | 'LEADERBOARD';

export const AppNavigator: React.FC = () => {
  const { theme } = useTheme();
  const [activeScreen, setActiveScreen] = useState<ScreenName>('TODAY_TASK');

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'TODAY_TASK': return <TodayTaskScreen />;
      case 'HISTORY': return <HistoryScreen />;
      case 'LEADERBOARD': return <RewardScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Screen View Body */}
      <View style={styles.body}>
        {renderActiveScreen()}
      </View>

      {/* Responsive Sticky Bottom Tab Bar */}
      <SafeAreaView style={[styles.bottomBarSafeArea, { backgroundColor: '#11141e' }]}>
        <View style={styles.bottomBar}>
          <Pressable
            style={[
              styles.tabItem,
              activeScreen === 'TODAY_TASK' ? styles.activeTab : null,
            ]}
            onPress={() => setActiveScreen('TODAY_TASK')}
          >
            <Compass size={22} color={activeScreen === 'TODAY_TASK' ? theme.primary : '#8A8F9E'} />
            <Text
              style={[
                styles.tabLabel,
                activeScreen === 'TODAY_TASK' ? { color: theme.primary } : null,
              ]}
            >
              Today
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabItem,
              activeScreen === 'HISTORY' ? styles.activeTab : null,
            ]}
            onPress={() => setActiveScreen('HISTORY')}
          >
            <Users size={22} color={activeScreen === 'HISTORY' ? theme.primary : '#8A8F9E'} />
            <Text
              style={[
                styles.tabLabel,
                activeScreen === 'HISTORY' ? { color: theme.primary } : null,
              ]}
            >
              Friends
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabItem,
              activeScreen === 'LEADERBOARD' ? styles.activeTab : null,
            ]}
            onPress={() => setActiveScreen('LEADERBOARD')}
          >
            <Trophy size={22} color={activeScreen === 'LEADERBOARD' ? theme.primary : '#8A8F9E'} />
            <Text
              style={[
                styles.tabLabel,
                activeScreen === 'LEADERBOARD' ? { color: theme.primary } : null,
              ]}
            >
              Vault
            </Text>
          </Pressable>
        </View>
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
  bottomBarSafeArea: {
    borderTopWidth: 1,
    borderTopColor: '#1d2230',
  },
  bottomBar: {
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 2,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 126, 95, 0.1)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8F9E',
    marginTop: 2,
  },
});
