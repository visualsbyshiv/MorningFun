import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Clock, Zap, Users, Brain, Sparkles, Plus, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useApp, FriendActivity, mapTaskFromDb } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';

const { width } = Dimensions.get('window');

export const HistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const {
    friends,
    setCurrentQuest,
    resetQuestState,
    historyLogs,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
    userId,
    isLoggedIn
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState<any[] | null>(null);
  const [successTaskId, setSuccessTaskId] = useState<string | null>(null);

  const [friendInput, setFriendInput] = useState('');

  const [dbHistoryLogs, setDbHistoryLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [filterType, setFilterType] = useState<'COMPLETED' | 'INCOMPLETE'>('COMPLETED');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredHistoryLogs = dbHistoryLogs.filter((log) => {
    if (filterType === 'COMPLETED') return log.isCompleted === true;
    if (filterType === 'INCOMPLETE') return log.isCompleted === false;
    return true;
  });

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      setDbHistoryLogs([]);
      return;
    }
    const fetchHistory = async () => {
      setIsLoadingLogs(true);
      try {
        const { data: dbTasks, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (dbTasks) {
          const mappedLogs = dbTasks.map(t => {
            const mappedTask = mapTaskFromDb(t);
            return {
              id: t.id,
              taskTitle: mappedTask.title,
              taskIcon: mappedTask.icon,
              dateStr: new Date(t.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
              timeTakenStr: t.is_completed ? 'Completed' : 'Expired/Reset',
              xpGained: t.is_completed ? mappedTask.xp : 0,
              isCompleted: t.is_completed
            };
          });
          setDbHistoryLogs(mappedLogs);
        }
      } catch (e) {
        console.warn('History logs fetch failed, running local calculations:', e);
        setDbHistoryLogs(historyLogs);
      } finally {
        setIsLoadingLogs(false);
      }
    };
    fetchHistory();
  }, [userId, isLoggedIn, historyLogs]);

  const handleAddFriend = () => {
    if (!friendInput.trim()) return;
    sendFriendRequest(friendInput.trim());
    setFriendInput('');
  };

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setSuccessTaskId(null);

    const statuses = [
      '🧠 AI Coach: Scanning lifestyle habits...',
      '⚡ AI Coach: Tailoring routine optimizations...',
      '✨ AI Coach: Finalizing personalized daily tasks...'
    ];

    let currentStep = 0;
    setAnalysisStatus(statuses[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < statuses.length) {
        setAnalysisStatus(statuses[currentStep]);
      } else {
        clearInterval(interval);
        setIsAnalyzing(false);

        const input = inputText.toLowerCase();
        let tasks = [];

        if (input.includes('tired') || input.includes('sleep') || input.includes('lazy') || input.includes('fatigue')) {
          tasks = [
            {
              id: 'c1',
              icon: '🧊',
              title: 'Splash ice-cold water on face',
              desc: 'Shock your nervous system to trigger noradrenaline release and eliminate morning fatigue.',
              difficulty: 'EASY',
              xp: 120,
            },
            {
              id: 'c2',
              icon: '🚶',
              title: 'Take a 5-minute brisk walk outdoors',
              desc: 'Get immediate sunlight and physical motion to align your circadian biology.',
              difficulty: 'EASY',
              xp: 140,
            }
          ];
        } else if (input.includes('water') || input.includes('drink') || input.includes('hydrate')) {
          tasks = [
            {
              id: 'c3',
              icon: '🍋',
              title: 'Drink warm lemon-infused water',
              desc: 'Squeeze a fresh lemon wedge in warm water to balance pH and aid morning digestion.',
              difficulty: 'EASY',
              xp: 130,
            },
            {
              id: 'c4',
              icon: '🏺',
              title: 'Copper bottle rehydration gulp',
              desc: 'Gulp 500ml of clean room-temperature water from a copper bottle to replenish fluids.',
              difficulty: 'EASY',
              xp: 110,
            }
          ];
        } else if (input.includes('write') || input.includes('gratitude') || input.includes('journal') || input.includes('mind') || input.includes('calm')) {
          tasks = [
            {
              id: 'c5',
              icon: '📓',
              title: 'Write a 3-sentence morning dump',
              desc: 'Freewrite three quick thoughts onto a notebook to clear mental space.',
              difficulty: 'EASY',
              xp: 120,
            },
            {
              id: 'c6',
              icon: '🌬️',
              title: 'Perform 4-4-4-4 box breathing',
              desc: 'Inhale, hold, exhale, hold for 4 seconds each. Calm down neural stress pathways.',
              difficulty: 'EASY',
              xp: 115,
            }
          ];
        } else {
          tasks = [
            {
              id: 'c7',
              icon: '📵',
              title: 'Digital lockbox morning time',
              desc: 'Keep your smartphone in another room for the first 30 minutes of waking.',
              difficulty: 'MEDIUM',
              xp: 160,
            },
            {
              id: 'c8',
              icon: '🌅',
              title: 'Greet the horizon from balcony',
              desc: 'Step outside and view the morning sky, taking 3 deep refreshing breaths.',
              difficulty: 'EASY',
              xp: 100,
            }
          ];
        }

        setGeneratedTasks(tasks);
      }
    }, 900);
  };

  const handleAssignTask = (task: any) => {
    setCurrentQuest(task);
    resetQuestState();
    setSuccessTaskId(task.id);
    
    if (Platform.OS === 'web') {
      alert(`🔮 AI Habit Coach: "${task.title}" has been set as your active task today! Go to the "Today" tab to complete it!`);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Yesterday's Recap Card */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Last Completed Quest</Text>
      {historyLogs.length > 0 ? (
        <LinearGradient
          colors={[theme.secondary, theme.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.recapCard}
        >
          <View style={styles.recapHeader}>
            <Text style={styles.recapHeaderLabel}>YOUR QUEST CLEARED</Text>
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>COMPLETED</Text>
            </View>
          </View>
          <Text style={styles.recapQuestTitle}>{historyLogs[0].taskIcon} {historyLogs[0].taskTitle}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Clock size={14} color="#FFF" />
              <Text style={styles.statValue}>{historyLogs[0].timeTakenStr}</Text>
              <Text style={styles.statLabel}>Time taken</Text>
            </View>
            <View style={styles.statItem}>
              <Zap size={14} color="#FFF" />
              <Text style={styles.statValue}>+{historyLogs[0].xpGained} XP</Text>
              <Text style={styles.statLabel}>Points gained</Text>
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.emptyRecapCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, marginBottom: 20 }]}>
          <Clock size={28} color={theme.textSecondary} style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyRecapTitle, { color: theme.textPrimary }]}>No quests cleared yet</Text>
          <Text style={[styles.emptyRecapDesc, { color: theme.textSecondary }]}>
            Hatch your first egg on the "Today's Task" tab and verify it to see your activity logs here!
          </Text>
        </View>
      )}

      {/* Pending Invites Section */}
      {friends.filter((f: FriendActivity) => f.status === 'pending_incoming').length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, marginBottom: 8 }]}>📩 Incoming Friend Invites</Text>
          <View style={[styles.friendsCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            {friends.filter((f: FriendActivity) => f.status === 'pending_incoming').map((friend: FriendActivity) => (
              <View key={friend.id} style={[styles.friendRow, { borderBottomColor: theme.cardBorder }]}>
                <Text style={styles.friendAvatar}>{friend.avatar}</Text>
                <View style={styles.friendDetails}>
                  <Text style={[styles.friendName, { color: theme.textPrimary }]}>{friend.name}</Text>
                  <Text style={[styles.friendStreak, { color: theme.textSecondary, fontSize: 10 }]}>Wants to compare morning habits</Text>
                </View>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: '#00E676', marginRight: 6 }]}
                    onPress={() => acceptFriendRequest(friend.id)}
                  >
                    <Text style={styles.smallBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
                    onPress={() => rejectFriendRequest(friend.id)}
                  >
                    <Text style={[styles.smallBtnText, { color: theme.textSecondary }]}>Ignore</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Friends Recap List */}
      <View style={styles.feedHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Morning Friends Feed</Text>
        <View style={[styles.feedCountBadge, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.feedCountText, { color: theme.secondary }]}>
            {friends.filter((f: FriendActivity) => f.status === 'accepted').length} active
          </Text>
        </View>
      </View>

      <View style={[styles.friendsCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, marginBottom: 16 }]}>
        {friends.filter((f: FriendActivity) => f.status === 'accepted').length > 0 ? (
          friends.filter((f: FriendActivity) => f.status === 'accepted').map((friend: FriendActivity) => (
            <View key={friend.id} style={[styles.friendRow, { borderBottomColor: theme.cardBorder }]}>
              <Text style={friend.completed ? styles.friendAvatar : [styles.friendAvatar, { opacity: 0.5 }]}>{friend.avatar}</Text>
              <View style={styles.friendDetails}>
                <Text style={[styles.friendName, { color: theme.textPrimary }]}>{friend.name}</Text>
                <Text style={[styles.friendStreak, { color: theme.secondary }]}>🔥 {friend.streak} Days active</Text>
              </View>
              {friend.completed ? (
                <View style={styles.friendCompleted}>
                  <Clock size={10} color="#00E676" />
                  <Text style={styles.friendTime}>{friend.time}</Text>
                </View>
              ) : (
                <View style={styles.friendSleeping}>
                  <Text style={styles.friendSleepingText}>💤 Sleeping</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>No accepted friends yet. Send invites below!</Text>
          </View>
        )}
      </View>

      {/* Add Friend Input Row */}
      <View style={[styles.addFriendContainer, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, marginBottom: 16 }]}>
        <TextInput
          style={[styles.addFriendInput, { color: theme.textPrimary }]}
          placeholder="Invite friend by name..."
          placeholderTextColor={theme.textSecondary}
          value={friendInput}
          onChangeText={setFriendInput}
        />
        <TouchableOpacity style={[styles.addFriendBtn, { backgroundColor: theme.primary }]} onPress={handleAddFriend}>
          <Text style={styles.addFriendBtnText}>Send Invite</Text>
        </TouchableOpacity>
      </View>

      {/* Sent Invites List */}
      {friends.filter((f: FriendActivity) => f.status === 'pending_outgoing').length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, marginBottom: 8 }]}>📤 Sent Invitations</Text>
          <View style={[styles.friendsCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            {friends.filter((f: FriendActivity) => f.status === 'pending_outgoing').map((friend: FriendActivity) => (
              <View key={friend.id} style={[styles.friendRow, { borderBottomColor: theme.cardBorder }]}>
                <Text style={styles.friendAvatar}>{friend.avatar}</Text>
                <View style={styles.friendDetails}>
                  <Text style={[styles.friendName, { color: theme.textPrimary }]}>{friend.name}</Text>
                  <Text style={[styles.friendStreak, { color: theme.textSecondary, fontSize: 10 }]}>Pending acceptance...</Text>
                </View>
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: 'rgba(255, 75, 75, 0.15)' }]}
                  onPress={() => rejectFriendRequest(friend.id)}
                >
                  <Text style={{ color: '#FF4B4B', fontSize: 10, fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Dynamic completed routine history log */}
      <View style={{ marginTop: 24, zIndex: 10 }}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Routine History Log</Text>

        {/* Dropdown Filter for Completed & Incomplete Tasks */}
        <View style={{ position: 'relative', zIndex: 99, marginBottom: 16 }}>
          <TouchableOpacity 
            style={[styles.dropdownButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]} 
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Text style={[styles.dropdownButtonText, { color: theme.textPrimary }]}>
              {filterType === 'COMPLETED' ? '✅ Completed Tasks' : '❌ Incompleted Tasks'}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>{isDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={[styles.dropdownMenu, { backgroundColor: theme.cardBackground === 'rgba(255, 255, 255, 0.12)' ? '#FFFFFF' : '#1E293B', borderColor: theme.cardBorder }]}>
              <TouchableOpacity 
                style={styles.dropdownItem} 
                onPress={() => { setFilterType('COMPLETED'); setIsDropdownOpen(false); }}
              >
                <Text style={[styles.dropdownItemText, { color: theme.cardBackground === 'rgba(255, 255, 255, 0.12)' ? '#1E293B' : '#F8F9FA', fontWeight: filterType === 'COMPLETED' ? 'bold' : 'normal' }]}>✅ Completed Tasks</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dropdownItem, { borderTopWidth: 1, borderTopColor: theme.cardBorder }]} 
                onPress={() => { setFilterType('INCOMPLETE'); setIsDropdownOpen(false); }}
              >
                <Text style={[styles.dropdownItemText, { color: theme.cardBackground === 'rgba(255, 255, 255, 0.12)' ? '#1E293B' : '#F8F9FA', fontWeight: filterType === 'INCOMPLETE' ? 'bold' : 'normal' }]}>❌ Incompleted Tasks</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isLoadingLogs ? (
          <View style={[styles.friendsCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, padding: 24, alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 12 }}>Syncing history...</Text>
          </View>
        ) : filteredHistoryLogs && filteredHistoryLogs.length > 0 ? (
          <View style={[styles.friendsCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            {filteredHistoryLogs.map((log) => {
              const isCompleted = log.isCompleted !== false; // default true if not specified
              return (
                <View key={log.id} style={[styles.friendRow, { borderBottomColor: theme.cardBorder, alignItems: 'center', justifyContent: 'space-between' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={styles.friendAvatar}>{log.taskIcon || '☀️'}</Text>
                    <View style={styles.friendDetails}>
                      <Text style={[styles.friendName, { color: theme.textPrimary }]}>{log.taskTitle}</Text>
                      <Text style={[styles.friendStreak, { color: theme.textSecondary }]}>{log.dateStr}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ 
                      backgroundColor: isCompleted ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 75, 75, 0.12)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isCompleted ? '#00E676' : '#FF4B4B',
                      marginBottom: 4
                    }}>
                      <Text style={{ 
                        color: isCompleted ? '#00E676' : '#FF4B4B', 
                        fontSize: 9, 
                        fontWeight: 'bold' 
                      }}>
                        {isCompleted ? 'COMPLETED' : 'EXPIRED/RESET'}
                      </Text>
                    </View>
                    <Text style={[styles.friendTime, { color: theme.textSecondary, fontSize: 10 }]}>
                      {log.timeTakenStr} {log.xpGained > 0 ? `• +${log.xpGained} XP` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.friendsCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, padding: 24, alignItems: 'center' }]}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🏆</Text>
            <Text style={[styles.friendName, { color: theme.textPrimary, textAlign: 'center', fontWeight: 'bold' }]}>
              No tasks found for this filter!
            </Text>
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 6, fontSize: 13 }}>
              Try changing the filter or complete some quests first!
            </Text>
          </View>
        )}
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
  recapCard: {
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.1)',
      },
    }),
    marginBottom: 20,
  },
  recapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recapHeaderLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1.5,
  },
  completedBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  completedBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#00E676',
  },
  recapQuestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 30,
  },
  statItem: {
    flexDirection: 'column',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  feedCountText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  friendsCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 8,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  friendAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  friendStreak: {
    fontSize: 11,
    marginTop: 2,
  },
  friendCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  friendTime: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#00E676',
  },
  friendSleeping: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  friendSleepingText: {
    fontSize: 10,
    color: '#8A8F9E',
    fontWeight: '600',
  },
  emptyRecapCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecapTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyRecapDesc: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
  },
  actionButtonsRow: {
    flexDirection: 'row',
  },
  smallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addFriendContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 8,
    alignItems: 'center',
    gap: 8,
  },
  addFriendInput: {
    flex: 1,
    fontSize: 12,
    paddingHorizontal: 8,
    height: 38,
  },
  addFriendBtn: {
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFriendBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  dropdownButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropdownMenu: {
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: 4,
    width: '100%',
    zIndex: 99,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemText: {
    fontSize: 12,
  },
});
