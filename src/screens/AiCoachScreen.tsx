import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, TextInput, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { Brain, Sparkles, Plus, Check, Settings } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp, Task } from '../context/AppContext';

const { width } = Dimensions.get('window');

export const AiCoachScreen: React.FC = () => {
  const { theme } = useTheme();
  const { setCurrentQuest, resetQuestState, setCustomQuestsQueue, geminiApiKey, setHasIntroduced, level } = useApp();

  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState<any[] | null>(null);
  const [successTaskId, setSuccessTaskId] = useState<string | null>(null);

  // Sync inputs with global context on mount or context changes
  useEffect(() => {
    // API keys are now securely bound to process.env and global state
  }, [geminiApiKey]);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setSuccessTaskId(null);

    // Get API Key
    let apiKey = geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

    if (!apiKey) {
      setAnalysisStatus('⚠️ No API key. Running simulated optimizer...');
      setTimeout(() => {
        let tasks: Task[] = [];
        let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY';
        if (level >= 6) {
          difficulty = 'HARD';
        } else if (level >= 3) {
          difficulty = 'MEDIUM';
        }

        if (difficulty === 'EASY') {
          tasks = [
            {
              id: 'c1',
              icon: '⏰',
              title: 'Wake up at 6 AM (Mock)',
              desc: 'Wake up early with the rising sun. Takes 1 minute.',
              difficulty: 'EASY',
              xp: 100,
              isCompleted: false,
              isLocked: false,
            },
            {
              id: 'c2',
              icon: '🧘',
              title: 'Simple 5-min meditation (Mock)',
              desc: 'Sit quietly and focus on breathing. Takes 5 minutes.',
              difficulty: 'EASY',
              xp: 120,
              isCompleted: false,
              isLocked: true,
            }
          ];
        } else if (difficulty === 'MEDIUM') {
          tasks = [
            {
              id: 'c3',
              icon: '🦒',
              title: 'Giraffe neck stretch (Mock)',
              desc: 'Stretch your neck and reach high to wake muscles. Takes 5 minutes.',
              difficulty: 'MEDIUM',
              xp: 130,
              isCompleted: false,
              isLocked: false,
            },
            {
              id: 'c4',
              icon: '🧹',
              title: 'Tidy desk workspace (Mock)',
              desc: 'Spend 5-8 minutes cleaning off flat surfaces to clear your mind.',
              difficulty: 'MEDIUM',
              xp: 140,
              isCompleted: false,
              isLocked: true,
            }
          ];
        } else {
          tasks = [
            {
              id: 'c5',
              icon: '🏃',
              title: '10-min shadow boxing (Mock)',
              desc: 'Light cardio shadow boxing to raise heart rate. Takes 10 minutes.',
              difficulty: 'HARD',
              xp: 220,
              isCompleted: false,
              isLocked: false,
            },
            {
              id: 'c6',
              icon: '🚿',
              title: 'Cold face splash shock (Mock)',
              desc: 'Splash cold water to shock your nervous system awake. Takes 5 minutes.',
              difficulty: 'HARD',
              xp: 250,
              isCompleted: false,
              isLocked: true,
            }
          ];
        }
        setGeneratedTasks(tasks);
        setCustomQuestsQueue(tasks);
        setHasIntroduced(true);
        setIsAnalyzing(false);
      }, 1500);
      return;
    }

    setAnalysisStatus('🧠 AI Coach: Scanning lifestyle habits...');
    try {
      const userDifficulty = level >= 6 ? 'HARD' : (level >= 3 ? 'MEDIUM' : 'EASY');
      const prompt = `You are a Senior Behavior Scientist and habit-building AI Coach for a mobile game called SolarHero.
The user describes their morning routine struggles, energy levels, and lifestyle as follows:
"${inputText}"

The user is currently at Game Level: ${level}.
Therefore, you MUST design tasks of difficulty level: "${userDifficulty}" only.
Each task MUST be completed in exactly 5 to 10 minutes (do NOT assign tasks that take longer).

Analyze this self-description and design exactly 3 highly customized, actionable morning routine tasks (MINIMUM of 2).
Each task must align with resolving their specific struggles.

You MUST respond in JSON format matching this array structure:
[
  {
    "id": "1",
    "icon": "Single Emoji representing the task",
    "title": "Short Task Title (Hinglish/English, e.g. Wake up at 6 AM)",
    "desc": "Explanation of how and why this helps, under 10 minutes",
    "difficulty": "${userDifficulty}",
    "xp": ${userDifficulty === 'HARD' ? 220 : (userDifficulty === 'MEDIUM' ? 140 : 100)},
    "isCompleted": false,
    "isLocked": false
  },
  {
    "id": "2",
    "icon": "Emoji",
    "title": "Short Task Title",
    "desc": "Explanation, under 10 minutes",
    "difficulty": "${userDifficulty}",
    "xp": ${userDifficulty === 'HARD' ? 240 : (userDifficulty === 'MEDIUM' ? 150 : 110)},
    "isCompleted": false,
    "isLocked": true
  },
  {
    "id": "3",
    "icon": "Emoji",
    "title": "Short Task Title",
    "desc": "Explanation, under 10 minutes",
    "difficulty": "${userDifficulty}",
    "xp": ${userDifficulty === 'HARD' ? 250 : (userDifficulty === 'MEDIUM' ? 160 : 120)},
    "isCompleted": false,
    "isLocked": true
  }
]`;

      setAnalysisStatus('⚡ AI Coach: Optimizing circadian biology...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API HTTP Error: ${response.status}`);
      }

      setAnalysisStatus('✨ AI Coach: Finalizing personalized daily tasks...');
      const json = await response.json();
      const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error('Empty response from Gemini.');
      }

      const tasks = JSON.parse(textResponse);
      const mappedTasks = tasks.map((task: any, idx: number) => ({
        ...task,
        isCompleted: false,
        isLocked: false,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        isExpired: false
      }));
      
      setGeneratedTasks(mappedTasks);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('solarhero_persona_tasks', JSON.stringify(mappedTasks));
      }
      setCustomQuestsQueue(mappedTasks);
      setHasIntroduced(true);
      setIsAnalyzing(false);

    } catch (err: any) {
      console.error('Gemini Coach error:', err);
      const fallbackTasks: Task[] = [
        {
          id: 'c1',
          icon: '🧊',
          title: 'Splash ice-cold water on face (Error Fallback)',
          desc: 'Shock your nervous system to trigger noradrenaline release and eliminate morning fatigue.',
          difficulty: 'EASY' as const,
          xp: 120,
          isCompleted: false,
          isLocked: false,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          isExpired: false
        },
        {
          id: 'c2',
          icon: '🚶',
          title: 'Take a 5-minute brisk walk outdoors (Error Fallback)',
          desc: 'Get immediate sunlight and physical motion to align your circadian biology.',
          difficulty: 'EASY' as const,
          xp: 140,
          isCompleted: false,
          isLocked: false,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          isExpired: false
        }
      ];
      setGeneratedTasks(fallbackTasks);
      setCustomQuestsQueue(fallbackTasks);
      setHasIntroduced(true);
      setIsAnalyzing(false);
    }
  };

  const handleAssignTask = (task: any) => {
    setCurrentQuest(task);
    resetQuestState();
    setSuccessTaskId(task.id);
    
    if (Platform.OS === 'web') {
      alert(`🔮 AI Habit Coach: "${task.title}" has been set as your active task today! Go to the "Today's Task" tab to complete it!`);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* AI Personal Coach Section */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🤖 AI Personal Habit Coach</Text>

      <View style={[styles.coachCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <View style={styles.coachHeader}>
          <Brain size={20} color={theme.primary} />
          <Text style={[styles.coachTitle, { color: theme.textPrimary }]}>Explain Yourself to AI</Text>
        </View>
        <Text style={[styles.coachDesc, { color: theme.textSecondary }]}>
          Describe your morning struggles, energy levels, or lifestyle goals. The AI Coach will analyze your profile and design customized, high-yield morning routines for you.
        </Text>

        <TextInput
          style={[
            styles.coachInput,
            {
              borderColor: theme.cardBorder,
              color: theme.textPrimary,
              backgroundColor: 'rgba(0, 0, 0, 0.12)',
            },
          ]}
          placeholder="e.g. 'I sleep late and wake up feeling extremely tired and lazy, need energy...'"
          placeholderTextColor={theme.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          numberOfLines={3}
        />

        {isAnalyzing ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="small" color={theme.secondary} />
            <Text style={[styles.analyzingText, { color: theme.secondary }]}>{analysisStatus}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.generateBtn,
              {
                backgroundColor: inputText.trim() ? theme.primary : 'rgba(128, 128, 128, 0.25)',
              },
            ]}
            onPress={handleGenerate}
            disabled={!inputText.trim()}
          >
            <Sparkles size={14} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.generateBtnText}>🔮 Analyze and Generate Tasks</Text>
          </TouchableOpacity>
        )}

        {generatedTasks && (
          <View style={styles.tasksSection}>
            <Text style={[styles.tasksTitle, { color: theme.textPrimary }]}>✨ Suggested AI Habits:</Text>
            {generatedTasks.map((task) => (
              <View key={task.id} style={[styles.customTaskItem, { backgroundColor: 'rgba(0, 0, 0, 0.12)', borderColor: theme.cardBorder }]}>
                <View style={styles.customTaskHeader}>
                  <Text style={styles.customTaskEmoji}>{task.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.customTaskTitle, { color: theme.textPrimary }]}>{task.title}</Text>
                    <Text style={[styles.customTaskDesc, { color: theme.textSecondary }]}>{task.desc}</Text>
                  </View>
                </View>
                <View style={styles.customTaskFooter}>
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>{task.difficulty} • +{task.xp} XP</Text>
                  </View>
                  {successTaskId === task.id ? (
                    <View style={styles.assignedBadge}>
                      <Check size={14} color="#00E676" />
                      <Text style={styles.assignedText}>Set as Active!</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.assignBtn, { backgroundColor: theme.secondary }]}
                      onPress={() => handleAssignTask(task)}
                    >
                      <Plus size={12} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.assignBtnText}>Make Today's Task</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
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
  settingsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  settingsContent: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  settingsDesc: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 10,
  },
  apiKeyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  apiKeyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 11,
    height: 38,
  },
  saveKeyBtn: {
    width: 70,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  saveKeyBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  coachCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 40,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  coachTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  coachDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 14,
  },
  coachInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    height: 70,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  analyzingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  generateBtn: {
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  tasksSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
  },
  tasksTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  customTaskItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  customTaskHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  customTaskEmoji: {
    fontSize: 24,
  },
  customTaskTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  customTaskDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  customTaskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8A8F9E',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignedText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: 'bold',
  },
  assignBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
