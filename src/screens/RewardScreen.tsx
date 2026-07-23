import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';

const { width } = Dimensions.get('window');

export const RewardScreen: React.FC = () => {
  const { theme } = useTheme();
  const { badges, streak, rewardBalance, isLoggedIn, userName } = useApp();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const { data: progressList, error } = await supabase
          .from('user_progress')
          .select(`
            points,
            streak,
            user_id,
            users (
              username
            )
          `)
          .order('points', { ascending: false });

        if (error) throw error;

        if (progressList) {
          const mappedList = progressList.map((item: any) => ({
            id: item.user_id,
            name: item.users?.username === userName ? `${item.users?.username} (You)` : (item.users?.username || 'Hero'),
            xp: item.points,
            streak: item.streak,
            avatar: '🦸‍♂️'
          }));
          setLeaderboard(mappedList.filter(u => u.xp > 0 || u.streak > 0));
        }
      } catch (e) {
        console.warn('Leaderboard fetch failed, running local calculations:', e);
        if (isLoggedIn && rewardBalance > 0) {
          setLeaderboard([
            { rank: 1, name: `${userName} (You)`, streak: streak, xp: rewardBalance, avatar: '🦸‍♂️' }
          ]);
        } else {
          setLeaderboard([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isLoggedIn, userName, streak, rewardBalance]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Leaderboard Section */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Global Rankings</Text>
      
      {isLoading ? (
        <View style={[styles.leaderboard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, padding: 20, alignItems: 'center' }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 12 }}>Syncing Rankings...</Text>
        </View>
      ) : leaderboard.length > 0 ? (
        <View style={[styles.leaderboard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          {leaderboard.map((user, idx) => {
            const rank = idx + 1;
            return (
              <View
                key={user.id || user.name}
                style={[
                  styles.row,
                  { borderBottomColor: theme.cardBorder },
                  user.name.includes('You') ? styles.highlightRow : null,
                ]}
              >
                <View style={styles.left}>
                  <Text style={[styles.rank, { color: theme.textSecondary }]}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`}
                  </Text>
                  <Text style={styles.avatar}>{user.avatar || '🦸‍♂️'}</Text>
                  <Text style={[styles.name, { color: theme.textPrimary }]}>{user.name}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={[styles.xp, { color: theme.secondary }]}>{user.xp} XP</Text>
                  <Text style={[styles.streak, { color: theme.primary }]}>🔥 {user.streak}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.leaderboard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, padding: 24, alignItems: 'center' }]}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🏆</Text>
          <Text style={[styles.name, { color: theme.textPrimary, textAlign: 'center', fontWeight: 'bold' }]}>
            No tasks completed yet!
          </Text>
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 6, fontSize: 13, paddingHorizontal: 12 }}>
            Complete your first morning task to join the worldwide leaderboard! 🏆
          </Text>
        </View>
      )}

      {/* Rewards Vault Badges Grid */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Rewards Vault</Text>
      <View style={styles.grid}>
        {badges.map((badge) => (
          <View
            key={badge.id}
            style={[
              styles.badgeCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
              },
              !badge.unlocked ? styles.lockedBadge : null,
            ]}
          >
            <View style={styles.iconBox}>
              <Text style={[styles.badgeIcon, !badge.unlocked ? styles.lockedIcon : null]}>
                {badge.icon}
              </Text>
              {!badge.unlocked && (
                <View style={styles.lockOverlay}>
                  <Lock size={12} color="#B0B5C0" />
                </View>
              )}
            </View>
            <Text style={[styles.badgeTitle, { color: theme.textPrimary }]}>{badge.title}</Text>
            <Text style={[styles.badgeDesc, { color: theme.textSecondary }]}>{badge.desc}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 14,
  },
  leaderboard: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  highlightRow: {
    backgroundColor: 'rgba(255, 126, 95, 0.12)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rank: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 24,
  },
  avatar: {
    fontSize: 20,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  xp: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  streak: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  badgeCard: {
    width: (width - 52) / 2,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
  },
  lockedBadge: {
    opacity: 0.45,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  badgeIcon: {
    fontSize: 28,
  },
  lockedIcon: {
    opacity: 0.2,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#2A2E3D',
    borderRadius: 10,
    padding: 2,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
});
