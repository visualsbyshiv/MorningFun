import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Dimensions, Image, TouchableOpacity, Platform, ActivityIndicator, Alert, Modal } from 'react-native';
import { Sun, Moon, Lock, CheckCircle, Clock, Camera, Upload, RefreshCw, AlertTriangle, Brain, Award } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  withRepeat,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useApp, Task } from '../context/AppContext';
import { Button } from '../components/Button';
import { QuestCard } from '../components/QuestCard';

const { width } = Dimensions.get('window');

export const TodayTaskScreen: React.FC = () => {
  const { theme, mode } = useTheme();
  const {
    currentQuest,
    questRevealed,
    questCompleted,
    completionTimeStr,
    timeElapsed,
    revealQuest,
    completeQuest,
    timeOfDay,
    setTimeOfDay,
    isCronRunning,
    setIsCronRunning,
    questsCompletedTodayCount,
    maxQuestsAllowedToday,
    geminiApiKey,
    hasIntroduced,
    dailyQuestsQueue,
    completeActiveTask,
    setCurrentQuest,
    resetQuestState,
    tasksCreatedAt,
    tasksExpired,
    setCustomQuestsQueue,
    level,
    addManualHistoryLog,
    selectActiveTaskIndex,
  } = useApp();

  const eggScale = useSharedValue(1);
  const eggRotation = useSharedValue(0);

  // Photo / Video proof and AI scanner states
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofMediaType, setProofMediaType] = useState<'image' | 'video' | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null);
  const [aiFeedback, setAiFeedback] = useState('');
  const [isVerifyModalVisible, setIsVerifyModalVisible] = useState(false);
  const fileInputRef = useRef<any>(null);

  const [realTime, setRealTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatRealTime = (date: Date) => {
    let h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? '0' + m : m;
    const displayS = s < 10 ? '0' + s : s;
    return `${displayH}:${displayM}:${displayS} ${ampm}`;
  };

  const scanY = useSharedValue(0);

  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const exp = tasksCreatedAt + 12 * 60 * 60 * 1000;
      setRemainingTime(Math.max(0, exp - Date.now()));

      // Check for individual task expirations in the queue
      let queueChanged = false;
      const updatedQueue = dailyQuestsQueue.map((task) => {
        const taskExpiresAt = task.expiresAt || exp;
        if (taskExpiresAt <= Date.now() && !task.isCompleted && !task.isExpired) {
          queueChanged = true;
          // Log as incomplete/skipped in History
          addManualHistoryLog(task.title, task.icon, false);
          return { ...task, isExpired: true };
        }
        return task;
      });

      if (queueChanged) {
        setCustomQuestsQueue(updatedQueue);
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [tasksCreatedAt, dailyQuestsQueue]);

  const formatCountdown = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleResetToDefaultTasks = () => {
    const localTasks: Task[] = [
      // EASY Tasks (for Level <= 2)
      { id: '1', icon: '⏰', title: 'Wake up at 6 AM', desc: 'Wake up early with the rising sun. Takes 1 minute.', difficulty: 'EASY', xp: 100 },
      { id: '2', icon: '🧘', title: 'Do simple 5-min meditation', desc: 'Sit quietly and focus on your breathing. Takes 5 minutes.', difficulty: 'EASY', xp: 120 },
      { id: '3', icon: '🌵', title: 'Drink water immediately', desc: 'Rehydrate your body with a fresh glass of water. Takes 2 minutes.', difficulty: 'EASY', xp: 100 },
      { id: '7', icon: '🛏️', title: 'Make your bed neatly', desc: 'Arrange sheets and fluff pillows to start the day with order. Takes 3 minutes.', difficulty: 'EASY', xp: 110 },
      { id: '9', icon: '🪟', title: 'Open windows for fresh sunlight', desc: 'Let fresh air and sunlight flow into your room. Takes 2 minutes.', difficulty: 'EASY', xp: 100 },
      { id: '10', icon: '☀️', title: 'Blind the sun with your smile', desc: 'Face the morning light, close your eyes, and smile wide for 2 minutes.', difficulty: 'EASY', xp: 105 },

      // MEDIUM Tasks (for Level 3 to 5)
      { id: '4', icon: '🦒', title: 'Waking giraffe neck stretches', desc: 'Stand straight on your tiptoes, reach high, and stretch your neck. Takes 5 minutes.', difficulty: 'MEDIUM', xp: 130 },
      { id: '5', icon: '📵', title: '10-minute digital detox', desc: 'Avoid looking at phone screen or notifications. Takes 10 minutes.', difficulty: 'MEDIUM', xp: 150 },
      { id: '8', icon: '🧹', title: 'Tidy up one flat surface', desc: 'Clear clutter from your desk or flat surface. Takes 8 minutes.', difficulty: 'MEDIUM', xp: 140 },
      { id: '6', icon: '📝', title: 'Write 3 morning gratitude points', desc: 'Reflect and write down three things you are thankful for today. Takes 5 minutes.', difficulty: 'MEDIUM', xp: 130 },
      { id: '12', icon: '🤸', title: '5-minute full body warm-up', desc: 'Do light joint rotations and muscle activation stretches. Takes 5 minutes.', difficulty: 'MEDIUM', xp: 145 },

      // HARD Tasks (for Level >= 6)
      { id: '13', icon: '🏃', title: '10-minute morning shadow boxing', desc: 'Do shadow boxing and light jumping jacks to raise your heart rate. Takes 10 minutes.', difficulty: 'HARD', xp: 220 },
      { id: '14', icon: '🚿', title: '1-minute cold splash/face shock', desc: 'Splash cold water on your face or take a cold shower splash. Takes 5 minutes.', difficulty: 'HARD', xp: 250 },
      { id: '15', icon: '📋', title: 'Detail plan your entire day', desc: 'Write down your schedule, priority tasks, and time blocks. Takes 8 minutes.', difficulty: 'HARD', xp: 210 },
      { id: '16', icon: '📖', title: 'Read 3 pages of a book', desc: 'Read a book carefully, absorbing the text. Takes 7 minutes.', difficulty: 'HARD', xp: 230 },
      { id: '17', icon: '💪', title: '15 quick pushups & core hold', desc: 'Perform 15 clean pushups and a 1-minute plank. Takes 6 minutes.', difficulty: 'HARD', xp: 240 },
    ];

    let currentDifficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY';
    if (level >= 6) {
      currentDifficulty = 'HARD';
    } else if (level >= 3) {
      currentDifficulty = 'MEDIUM';
    }

    // Log incomplete tasks from old queue before reset
    dailyQuestsQueue.forEach((task) => {
      if (!task.isCompleted) {
        addManualHistoryLog(task.title, task.icon, false);
      }
    });

    const pool = localTasks.filter(t => t.difficulty === currentDifficulty);
    const randomIdx1 = Math.floor(Math.random() * pool.length);
    let randomIdx2 = Math.floor(Math.random() * pool.length);
    while (randomIdx2 === randomIdx1 && pool.length > 1) {
      randomIdx2 = Math.floor(Math.random() * pool.length);
    }
    const defaultTasks = pool.length > 1 ? [
      { ...pool[randomIdx1], isCompleted: false, isLocked: false, expiresAt: Date.now() + 12 * 60 * 60 * 1000 },
      { ...pool[randomIdx2], isCompleted: false, isLocked: false, expiresAt: Date.now() + 12 * 60 * 60 * 1000 }
    ] : [
      { ...pool[0], isCompleted: false, isLocked: false, expiresAt: Date.now() + 12 * 60 * 60 * 1000 }
    ];
    setCustomQuestsQueue(defaultTasks);
    Alert.alert("Tasks Reset", `Your 12-hour timer has been restarted with 2 basic ${currentDifficulty} tasks! ⚡`);
  };

  // Sample proofs mapped by Quest ID
  const SAMPLE_PROOFS: Record<string, string> = {
    '1': 'https://images.unsplash.com/photo-1520302873430-e17f6d13328e?auto=format&fit=crop&w=400&q=80',
    '2': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80',
    '3': 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80',
    '4': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80',
    '5': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=400&q=80',
    '6': 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=400&q=80',
    '7': 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=400&q=80',
    '8': 'https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?auto=format&fit=crop&w=400&q=80',
    '9': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80',
    '10': 'https://images.unsplash.com/photo-1495616811223-4d98c6e968ab?auto=format&fit=crop&w=400&q=80',
  };

  // Scanning animation loop
  useEffect(() => {
    if (isScanning) {
      scanY.value = 0;
      scanY.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200 }),
          withTiming(0, { duration: 1200 })
        ),
        -1, // Infinite loop
        true
      );
    } else {
      scanY.value = 0;
    }
  }, [isScanning]);

  const startAiVerification = async () => {
    if (!proofImage || !currentQuest) return;
    setIsScanning(true);
    setVerificationSuccess(null);
    setAiFeedback('');
    setScanStatus('🤖 AI: Initializing Gemini Vision API...');

    // Get API Key
    let apiKey = geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

    if (!apiKey) {
      setScanStatus('⚠️ No API Key found. Running simulated validation...');
      const statuses = [
        '🔍 AI: Detecting visual features...',
        `🌵 AI: Searching for "${currentQuest.title}" matches...`,
        '📊 AI: Completing simulated confidence analysis...'
      ];

      let step = 0;
      const interval = setInterval(() => {
        if (step < statuses.length) {
          setScanStatus(statuses[step]);
          step++;
        } else {
          clearInterval(interval);
          setIsScanning(false);
          
          // Simulation fallback: Fail 65% of the time to demonstrate mismatch controls
          const simulatedMatch = Math.random() > 0.65;
          setVerificationSuccess(simulatedMatch);
          if (simulatedMatch) {
            setAiFeedback('AI Verified (Simulated)! The uploaded image matches the quest parameters.');
          } else {
            setAiFeedback('Mismatch (Simulated): Uploaded image does not seem to contain proof of this routine.');
            Alert.alert("Verification Failed ⚠️", "Please upload valid photo/video proof to complete this task!");
          }
        }
      }, 1000);
      return;
    }

    try {
      // Extract base64 and MIME type
      const match = proofImage.match(/^data:((?:image|video)\/[a-zA-Z+.-]+);base64,(.+)$/);
      let mimeType = 'image/jpeg';
      let base64Data = '';

      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        if (proofImage.startsWith('http')) {
          setScanStatus('🌐 AI: Downloading media data...');
          const res = await fetch(proofImage);
          const blob = await res.blob();
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
          });
          reader.readAsDataURL(blob);
          const dataUrl = await base64Promise;
          const nestedMatch = dataUrl.match(/^data:((?:image|video)\/[a-zA-Z+.-]+);base64,(.+)$/);
          if (nestedMatch) {
            mimeType = nestedMatch[1];
            base64Data = nestedMatch[2];
          }
        }
      }

      if (!base64Data) {
        throw new Error('Media file format could not be read.');
      }

      setScanStatus('⚡ AI: Evaluating visual proof strictly...');

      const prompt = `You are an extremely strict AI quality auditor for a morning routine game called SolarHero.
Your job is to prevent cheating. Look at the image carefully and check if it matches the daily quest: "${currentQuest.title}".

Quest-specific strict matching criteria:
1. "Drink water like a thirsty cactus": The image MUST clearly show a glass of water, a water bottle, a cup, or a person drinking. If it is just a selfie without water, or a random room, or a computer screen, you MUST mark it as a mismatch.
2. "Make your bed neatly": The image MUST clearly show a bed that is neatly arranged, pillows placed properly, or sheets folded. If the bed is messy or you cannot see a bed, you MUST reject.
3. "Open windows for fresh sunlight": The image MUST show an open window, window frame with daylight, or balcony door open. Reject if no window or it is closed.
4. "Waking giraffe neck stretches": The image MUST show a person stretching their arms/neck, or in a yoga/meditation pose. Reject if static face selfie.
5. "No screen for 15 minutes": The image MUST show clean books, coffee, morning views, or relaxation. If you see a glowing phone, computer screen, or TV active, you MUST reject.
6. "Write 3 morning gratitude points": The image MUST show a handwritten diary, journal page, notepad, or pen on paper. Reject if no text.
7. "Take 5 mindful deep breaths": The image MUST show green plants, calm morning scenery, or meditation posture. Reject if cluttered or screen.
8. "Tidy up one flat surface": The image MUST show an organized desk, clean table top, or neat counter. Reject if messy or cluttered.
9. "Neatly align your exit shoes": The image MUST show a pair of shoes aligned neatly side-by-side. Reject if scattered shoes, dirty floor, or no shoes.
10. "Blind the sun with your smile": The image MUST show a clear human smiling face. Reject if no smile, no face, or dark.

If the image is a mismatch, set "success" to false, "confidence" to under 50, and write a firm feedback in Hinglish stating "mismatch: [Reason in Hindi/Hinglish]".
If it matches perfectly, set "success" to true, "confidence" to above 85, and write a positive feedback in Hinglish.

Response JSON Schema:
{
  "success": true or false,
  "confidence": number (0-100),
  "feedback": "A short Hinglish explanation of what you detected and why it matched or mismatched."
}`;

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
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API HTTP Error: ${response.status}`);
      }

      const json = await response.json();
      const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error('Empty response from Gemini.');
      }

      const result = JSON.parse(textResponse);
      setIsScanning(false);

      if (result.success === true && result.confidence >= 80) {
        setVerificationSuccess(true);
        setAiFeedback(result.feedback);
      } else {
        setVerificationSuccess(false);
        setAiFeedback(result.feedback || 'Mismatch: AI could not verify this task.');
        Alert.alert("Verification Failed ⚠️", "Please upload valid photo/video proof to complete this task!");
      }

    } catch (err: any) {
      console.error('Gemini error:', err);
      setScanStatus(`⚠️ Connection/API error: ${err.message}.`);
      setTimeout(() => {
        setIsScanning(false);
        setVerificationSuccess(false);
        setAiFeedback('Mismatch: Connection error or invalid API configurations. Please try again!');
      }, 1500);
    }
  };

  const handleSimulatePhoto = () => {
    if (!currentQuest) return;
    setProofMediaType('image');
    const sampleUrl = SAMPLE_PROOFS[currentQuest.id] || SAMPLE_PROOFS['1'];
    setProofImage(sampleUrl);
    setVerificationSuccess(null);
  };

  const handleSimulateVideo = () => {
    if (!currentQuest) return;
    setProofMediaType('video');
    // Using a sample MP4 video URL
    setProofImage('https://www.w3schools.com/html/mov_bbb.mp4');
    setVerificationSuccess(null);
  };

  const handleClaimReward = () => {
    completeQuest();
    // Clean states
    setProofImage(null);
    setProofMediaType(null);
    setVerificationSuccess(null);
    setIsVerifyModalVisible(false);
  };

  const handleRetake = () => {
    setProofImage(null);
    setProofMediaType(null);
    setVerificationSuccess(null);
  };

  const scanLineStyle = useAnimatedStyle(() => {
    return {
      top: `${scanY.value * 100}%`,
    };
  });

  const hours = Math.floor(timeOfDay / 60);
  const minutes = timeOfDay % 60;
  const isNightTime = hours >= 20 || hours < 6;

  const handleEggPress = () => {
    if (isNightTime) {
      // Shake warning
      eggRotation.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-5, { duration: 60 }),
        withTiming(5, { duration: 60 }),
        withSpring(0)
      );
    } else {
      // Breakout animation
      eggScale.value = withSpring(0.85, {}, () => {
        eggScale.value = withTiming(3, { duration: 400 }, () => {
          eggScale.value = 1;
        });
        // Reveal quest on JS thread
        runOnJS(revealQuest)();
      });
    }
  };

  const formatTimeStr = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? '0' + m : m;
    return `${displayH}:${displayM} ${ampm}`;
  };

  const eggAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: eggScale.value },
        { rotate: `${eggRotation.value}deg` },
      ],
    };
  });

  const allTasksCompleted = dailyQuestsQueue.length > 0 && dailyQuestsQueue.every(task => task.isCompleted);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Simulation Controls Card */}
      <View style={[styles.cronCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <View style={styles.cronRow}>
          <View style={styles.cronTimeBox}>
            <Sun size={18} color={theme.primary} />
            <Text style={[styles.cronTimeText, { color: theme.textPrimary }]}>
              {formatRealTime(realTime)}
            </Text>
          </View>
          <Pressable
            style={styles.cronToggle}
            onPress={() => setIsCronRunning(!isCronRunning)}
          >
            <Text style={[styles.cronToggleText, { color: theme.primary }]}>
              {isCronRunning ? '⏰ Fast forward clock' : '⏸️ Time Paused'}
            </Text>
          </Pressable>
        </View>
        <Text style={[styles.cronDesc, { color: theme.textSecondary }]}>
          {isNightTime
            ? 'Incubator Active. New quests drop at 8:00 PM and unlock in the morning.'
            : 'Daylight Active! Tap the egg below to hatch today\'s quest.'}
        </Text>
      </View>

      {tasksExpired && !allTasksCompleted ? (
        <View style={styles.limitContainer}>
          <View style={[styles.limitCard, { backgroundColor: theme.cardBackground, borderColor: '#FF3D00' }]}>
            <Clock size={48} color="#FF3D00" />
            <Text style={[styles.limitTitle, { color: theme.textPrimary, textAlign: 'center', marginTop: 12 }]}>
              ⏳ Tasks Expired!
            </Text>
            <Text style={[styles.limitDesc, { color: theme.textSecondary, marginTop: 8 }]}>
              Your daily routine tasks have expired. You had 12 hours to complete them.
            </Text>
            <Button
              title="Reset Tasks & Restart Timer ⚡"
              onPress={handleResetToDefaultTasks}
              variant="primary"
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      ) : !hasIntroduced ? (
        <View style={styles.limitContainer}>
          <View style={[styles.onboardingCard, { backgroundColor: theme.cardBackground, borderColor: theme.secondary }]}>
            <Brain size={48} color={theme.secondary} />
            <Text style={[styles.limitTitle, { color: theme.textPrimary, textAlign: 'center', marginTop: 12 }]}>
              Meet Your AI Coach! 🧠
            </Text>
            <Text style={[styles.limitDesc, { color: theme.textSecondary, marginTop: 8 }]}>
              Welcome to SolarHero! Get started by describing your morning routine struggles and energy goals to the AI Coach to hatch your tailored daily habit routine.
            </Text>
            <Text style={[styles.onboardingActionText, { color: theme.primary, fontWeight: 'bold', marginTop: 16, textAlign: 'center' }]}>
              👉 Go to the "AI Coach" tab to introduce yourself! ⚡
            </Text>
          </View>
        </View>
      ) : allTasksCompleted ? (
        <View style={styles.limitContainer}>
          <View style={[styles.limitCard, { backgroundColor: theme.cardBackground, borderColor: '#00E676' }]}>
            <Award size={48} color="#00E676" />
            <Text style={[styles.limitTitle, { color: theme.textPrimary, textAlign: 'center', marginTop: 12 }]}>
              ✨ No tasks here! You are all caught up for the morning. Clean sweep! 🏆
            </Text>
            <Text style={[styles.limitProgress, { color: '#00E676', marginTop: 8 }]}>
              Progress: {questsCompletedTodayCount} / {maxQuestsAllowedToday} Tasks Completed
            </Text>
            <Text style={[styles.limitDesc, { color: theme.textSecondary, marginTop: 8 }]}>
              All morning routine tasks are checked off. Keep up the circadian consistency!
            </Text>
            <Text style={[styles.limitTip, { color: theme.secondary, marginTop: 12 }]}>
              💡 Want more tasks? Go to the Boost tab, watch a sponsor ad, and get another quest instantly!
            </Text>
          </View>
        </View>
      ) : !questRevealed ? (
        // STATE A: EGG VIEW
        <View style={styles.eggContainer}>
          <View style={[styles.eggBadge, { backgroundColor: '#1E1B2C', borderColor: theme.secondary }]}>
            <View style={[styles.pulseCircle, { backgroundColor: isNightTime ? '#F39C12' : '#00E676' }]} />
            <Text style={[styles.eggBadgeText, { color: theme.secondary }]}>
              {isNightTime ? 'TWILIGHT EGG LOCKED' : '☀️ BREAKOUT READY'}
            </Text>
          </View>

          <Animated.View style={[styles.eggWrapper, eggAnimatedStyle]}>
            <Pressable onPress={handleEggPress}>
              <View
                style={[
                  styles.eggCircle,
                  {
                    backgroundColor: isNightTime ? '#1b1a26' : theme.primary,
                    borderColor: theme.secondary,
                  },
                ]}
              >
                <Text style={styles.eggEmoji}>{isNightTime ? '🪐' : '☀️'}</Text>
                {isNightTime && <Lock size={24} color={theme.secondary} style={styles.lockIcon} />}
              </View>
            </Pressable>
          </Animated.View>

          <Text style={[styles.eggTitle, { color: theme.textPrimary }]}>
            {isNightTime ? 'Incubating Morning Quest' : 'Sunrise Breakout Ready!'}
          </Text>
          <Text style={[styles.eggDesc, { color: theme.textSecondary }]}>
            {isNightTime
              ? 'Wait for the sunrise (6:00 AM) or use the simulation control to fast forward time.'
              : 'Tap the glowing solar egg to trigger the sunrise breakout!'}
          </Text>
        </View>
      ) : (
        // STATE B: QUEST CARD VIEW
        <View style={styles.questContainer}>
          {questCompleted ? (
            <View style={[styles.completedCard, { backgroundColor: 'rgba(0, 230, 118, 0.08)', borderColor: '#00E676' }]}>
              <CheckCircle size={56} color="#00E676" />
              <Text style={styles.completedTitle}>Quest Completed!</Text>
              <Text style={[styles.completedSub, { color: theme.textSecondary }]}>
                {currentQuest?.title}
              </Text>
              <View style={styles.rewardRow}>
                <View style={[styles.rewardPill, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.rewardText, { color: theme.textPrimary }]}>⚡ +{currentQuest?.xp} XP</Text>
                </View>
                <View style={[styles.rewardPill, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.rewardText, { color: theme.textPrimary }]}>🔥 +1 Day</Text>
                </View>
              </View>
              <Text style={[styles.timeElapsedText, { color: theme.textSecondary }]}>
                Completed in: {completionTimeStr}
              </Text>
            </View>
          ) : currentQuest ? (
            <QuestCard quest={currentQuest}>
              <View style={styles.timerRow}>
                <Clock size={14} color={theme.primary} />
                <Text style={[styles.timerText, { color: theme.primary }]}>
                  Timer: {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s
                </Text>
              </View>

              <View style={{ width: '100%', marginVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                  Upload valid photo or video proof to verify the routine completion.
                </Text>
                
                <Button
                  title="Verify Task Proof 🤖"
                  onPress={() => {
                    setProofImage(null);
                    setProofMediaType(null);
                    setVerificationSuccess(null);
                    setAiFeedback('');
                    setIsVerifyModalVisible(true);
                  }}
                  variant="primary"
                  style={{ width: '90%', height: 48, borderRadius: 24 }}
                />
              </View>
            </QuestCard>
          ) : (
            <View style={{
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
              borderWidth: 1.5,
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: 20,
              width: '100%',
            }}>
              <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center' }}>
                Select a task from Today's Routine List below to start! 🌅
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Task Checklist rendered when hasIntroduced is true and tasks are not completely finished */}
      {hasIntroduced && !allTasksCompleted && (
        <View style={styles.checklistContainer}>
          <View style={styles.checklistHeaderRow}>
            <Text style={[styles.checklistSectionTitle, { color: theme.textPrimary }]}>
              🌅 Today's Routine List
            </Text>
            {!tasksExpired && (
              <View style={[styles.countdownBadge, { backgroundColor: 'rgba(255, 61, 0, 0.12)', borderColor: '#FF3D00', borderWidth: 1 }]}>
                <Clock size={12} color="#FF3D00" style={{ marginRight: 4 }} />
                <Text style={[styles.countdownBadgeText, { color: '#FF3D00', fontWeight: 'bold', fontSize: 11 }]}>
                  Expires in: {formatCountdown(remainingTime)}
                </Text>
              </View>
            )}
          </View>
          {dailyQuestsQueue.map((task) => {
            const isTaskLocked = false;
            const isTaskCompleted = task.isCompleted ?? false;
            const isTaskExpired = task.isExpired ?? false;

            // Calculate individual countdown timer
            const taskExpiresAt = task.expiresAt || (tasksCreatedAt + 12 * 60 * 60 * 1000);
            const taskRemaining = Math.max(0, taskExpiresAt - Date.now());
            
            return (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.checklistItem,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: isTaskCompleted ? '#00E676' : isTaskExpired ? '#FF4B4B' : theme.cardBorder,
                    opacity: isTaskExpired ? 0.6 : 1,
                  }
                ]}
                disabled={isTaskExpired || isTaskCompleted}
                onPress={() => {
                  // Set this quest index as active!
                  const targetIndex = dailyQuestsQueue.findIndex(t => t.id === task.id);
                  if (targetIndex !== -1) {
                    selectActiveTaskIndex(targetIndex);
                    resetQuestState();
                    revealQuest();
                    setProofImage(null);
                    setProofMediaType(null);
                    setVerificationSuccess(null);
                    setAiFeedback('');
                    setIsVerifyModalVisible(true);
                  }
                }}
              >
                <View style={styles.checklistLeft}>
                  {isTaskCompleted ? (
                    <CheckCircle size={20} color="#00E676" />
                  ) : isTaskExpired ? (
                    <AlertTriangle size={20} color="#FF4B4B" />
                  ) : (
                    <View style={[styles.checkboxOutline, { borderColor: theme.primary }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.checklistTitle,
                        {
                          color: theme.textPrimary,
                          textDecorationLine: isTaskCompleted ? 'line-through' : 'none',
                        }
                      ]}
                    >
                      {task.icon} {task.title}
                    </Text>

                    {/* Live countdown timer directly on each task card */}
                    {!isTaskCompleted && (
                      <Text style={{ 
                        color: isTaskExpired ? '#FF4B4B' : theme.secondary, 
                        fontSize: 11, 
                        fontWeight: 'bold',
                        marginTop: 4 
                      }}>
                        {isTaskExpired 
                          ? '⏱️ Expired' 
                          : `⏱️ Expires in: ${formatCountdown(taskRemaining)}`}
                      </Text>
                    )}

                    <Text style={[styles.checklistDesc, { color: theme.textSecondary, marginTop: 4 }]}>
                      {task.desc}
                    </Text>
                  </View>
                </View>
                {isTaskExpired ? (
                  <View style={[styles.activeIndicatorBadge, { backgroundColor: 'rgba(255, 75, 75, 0.12)', borderColor: '#FF4B4B', borderWidth: 1 }]}>
                    <Text style={[styles.activeIndicatorBadgeText, { color: '#FF4B4B' }]}>EXPIRED</Text>
                  </View>
                ) : isTaskCompleted ? (
                  <View style={[styles.activeIndicatorBadge, { backgroundColor: 'rgba(0, 230, 118, 0.12)', borderColor: '#00E676', borderWidth: 1 }]}>
                    <Text style={[styles.activeIndicatorBadgeText, { color: '#00E676' }]}>DONE</Text>
                  </View>
                ) : (
                  <View style={[styles.activeIndicatorBadge, { backgroundColor: theme.secondary }]}>
                    <Text style={styles.activeIndicatorBadgeText}>ACTIVE</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Verify Task Proof Dedicated Modal */}
      <Modal
        visible={isVerifyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVerifyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: mode === 'day' ? '#FFFFFF' : '#11141E', borderColor: theme.cardBorder, maxHeight: '90%' }]}>
            
            {/* Modal Header */}
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 16 }}>🤖 Verify Task Proof</Text>
              <TouchableOpacity onPress={() => setIsVerifyModalVisible(false)} style={{ padding: 4 }}>
                <Text style={{ color: '#FF4B4B', fontSize: 13, fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>

            {currentQuest && (
              <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                
                {/* Task Details Display inside Modal */}
                <View style={{ alignItems: 'center', marginVertical: 10, padding: 12, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 16, backgroundColor: mode === 'day' ? '#F8FAFC' : 'rgba(255,255,255,0.02)' }}>
                  <Text style={{ fontSize: 42, marginBottom: 8 }}>{currentQuest.icon}</Text>
                  <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 18, textAlign: 'center', marginBottom: 6 }}>
                    {currentQuest.title}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 16 }}>
                    {currentQuest.desc}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <View style={{ backgroundColor: 'rgba(0,230,118,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                      <Text style={{ color: '#00E676', fontSize: 10, fontWeight: 'bold' }}>+{currentQuest.xp} XP</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,145,0,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                      <Text style={{ color: '#FF9100', fontSize: 10, fontWeight: 'bold' }}>{currentQuest.difficulty}</Text>
                    </View>
                  </View>
                </View>

                {/* HTML file input (web-only, rendered inside Modal) */}
                {Platform.OS === 'web' && (
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,video/*"
                    onChange={(e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const type = file.type.startsWith('video') ? 'video' : 'image';
                        setProofMediaType(type);
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setProofImage(event.target?.result as string);
                          setVerificationSuccess(null);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                )}

                {proofImage === null ? (
                  // UPLOAD PROOF BUTTONS
                  <View style={{ marginVertical: 14 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 8, textAlign: 'center' }}>
                      Camera / Gallery: select or capture a Photo or Short Video
                    </Text>
                    <View style={{ flexDirection: 'column', gap: 10 }}>
                      <TouchableOpacity
                        style={{
                          height: 44,
                          borderRadius: 22,
                          borderWidth: 1.5,
                          borderColor: theme.primary,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 8
                        }}
                        onPress={() => {
                          if (Platform.OS === 'web' && fileInputRef.current) {
                            fileInputRef.current.click();
                          } else {
                            handleSimulatePhoto();
                          }
                        }}
                      >
                        <Upload size={16} color={theme.primary} />
                        <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13 }}>Upload Photo/Video</Text>
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.primary,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 6
                          }}
                          onPress={handleSimulatePhoto}
                        >
                          <Camera size={14} color="#FFF" />
                          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>Simulate Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                            flex: 1,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.secondary,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 6
                          }}
                          onPress={handleSimulateVideo}
                        >
                          <Camera size={14} color="#FFF" />
                          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>Simulate Video</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  // PREVIEW AND AI AUDIT STAGE
                  <View style={{ marginVertical: 14, alignItems: 'center' }}>
                    <View style={{
                      width: '100%',
                      height: 180,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: theme.cardBorder,
                      overflow: 'hidden',
                      marginBottom: 12,
                      backgroundColor: '#000',
                      position: 'relative'
                    }}>
                      {proofMediaType === 'video' ? (
                        Platform.OS === 'web' ? (
                          <video
                            src={proofImage}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            controls
                            autoPlay
                            loop
                            muted
                          />
                        ) : (
                          <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#FFF', fontSize: 28, marginBottom: 8 }}>📹</Text>
                            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>Simulated Video Active</Text>
                          </View>
                        )
                      ) : (
                        <Image source={{ uri: proofImage }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                      )}
                      
                      {isScanning && (
                        <Animated.View style={[styles.scanLine, { backgroundColor: theme.accent }, scanLineStyle]} />
                      )}
                    </View>

                    {/* Scan status feedback */}
                    {isScanning && (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 145, 0, 0.12)',
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        marginBottom: 12,
                        width: '100%',
                        justifyContent: 'center'
                      }}>
                        <ActivityIndicator size="small" color={theme.accent} style={{ marginRight: 6 }} />
                        <Text style={{ color: theme.accent, fontSize: 11, fontWeight: 'bold' }}>{scanStatus}</Text>
                      </View>
                    )}

                    {/* AI Audit Action buttons */}
                    {!isScanning && verificationSuccess === null && (
                      <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                        <TouchableOpacity
                          style={{
                            flex: 2,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: theme.primary,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                          onPress={startAiVerification}
                        >
                          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>🤖 Submit Proof to AI</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                            flex: 1,
                            height: 42,
                            borderRadius: 21,
                            borderWidth: 1.5,
                            borderColor: theme.textSecondary,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                          onPress={handleRetake}
                        >
                          <Text style={{ color: theme.textSecondary, fontWeight: 'bold', fontSize: 13 }}>Retake</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Verification Result states */}
                    {!isScanning && verificationSuccess === true && (
                      <View style={{ width: '100%', alignItems: 'center' }}>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: 'rgba(0, 230, 118, 0.12)',
                          borderColor: '#00E676',
                          borderWidth: 1,
                          padding: 10,
                          borderRadius: 12,
                          marginBottom: 12,
                          width: '100%'
                        }}>
                          <CheckCircle size={16} color="#00E676" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#00E676', fontSize: 11, fontWeight: 'bold', flex: 1 }}>
                            {aiFeedback || 'AI Verified successfully! Confidence score >80%.'}
                          </Text>
                        </View>
                        
                        <Button
                          title={`Claim XP (+${currentQuest.xp} XP)`}
                          onPress={handleClaimReward}
                          variant="success"
                          style={{ width: '100%', height: 44, borderRadius: 22 }}
                        />
                      </View>
                    )}

                    {!isScanning && verificationSuccess === false && (
                      <View style={{ width: '100%', alignItems: 'center' }}>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: 'rgba(255, 75, 75, 0.12)',
                          borderColor: '#FF4B4B',
                          borderWidth: 1,
                          padding: 10,
                          borderRadius: 12,
                          marginBottom: 12,
                          width: '100%'
                        }}>
                          <AlertTriangle size={16} color="#FF4B4B" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#FF4B4B', fontSize: 11, fontWeight: 'bold', flex: 1 }}>
                            {aiFeedback || 'AI Rejected proof. Please upload valid proof to complete!'}
                          </Text>
                        </View>

                        <Button
                          title="Try Another Proof"
                          onPress={handleRetake}
                          variant="primary"
                          style={{ width: '100%', height: 44, borderRadius: 22 }}
                        />
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  cronCard: {
    width: width - 40,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  cronRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cronTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cronTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cronToggle: {
    backgroundColor: 'rgba(255, 126, 95, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  cronToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cronDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  eggContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  eggBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 30,
  },
  pulseCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  eggBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  eggWrapper: {
    width: 180,
    height: 220,
    marginBottom: 30,
  },
  eggCircle: {
    width: 180,
    height: 220,
    borderRadius: 90,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  eggEmoji: {
    fontSize: 64,
  },
  lockIcon: {
    position: 'absolute',
    bottom: 24,
  },
  eggTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  eggDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 24,
  },
  questContainer: {
    alignItems: 'center',
  },
  completedCard: {
    width: width - 40,
    borderRadius: 30,
    borderWidth: 1.5,
    padding: 30,
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00E676',
    marginVertical: 12,
  },
  completedSub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rewardPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeElapsedText: {
    fontSize: 12,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 126, 95, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  completeBtn: {
    width: '100%',
  },
  uploadContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  uploadLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 44,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  simulateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    height: 44,
  },
  simulateBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  previewFrame: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 0px 5px rgba(0, 230, 118, 0.8)',
      },
    }),
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 126, 95, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  smallVerifyBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallVerifyBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  smallRetakeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallRetakeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
  },
  successStatusText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: 'bold',
  },
  failureStatusText: {
    color: '#FF4B4B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  claimBtn: {
    width: '100%',
  },
  limitContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  limitCard: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  limitEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  limitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  limitProgress: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  limitDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  limitTip: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },
  onboardingCard: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  onboardingActionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  checklistContainer: {
    width: width - 40,
    marginTop: 24,
    gap: 12,
    marginBottom: 40,
  },
  checklistSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  checklistItem: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkboxOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  checklistDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  activeIndicatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeIndicatorBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  checklistHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countdownBadgeText: {
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
});
