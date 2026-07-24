import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const isUuid = (str: string) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str);
};

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export type AppStateMode = 'LOCKED_NIGHT' | 'ACTIVE_DAY';

export const mapTaskFromDb = (dbTask: any): Task => {
  let icon = '☀️';
  let desc = '';
  let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY';
  let xp = 100;
  let title = dbTask.title;

  if (dbTask.title && dbTask.title.startsWith('{')) {
    try {
      const parsed = JSON.parse(dbTask.title);
      title = parsed.title;
      icon = parsed.icon || icon;
      desc = parsed.desc || desc;
      difficulty = parsed.difficulty || difficulty;
      xp = parsed.xp || xp;
    } catch (e) {}
  } else {
    icon = dbTask.icon || icon;
    desc = dbTask.description || dbTask.desc || desc;
    difficulty = dbTask.difficulty || difficulty;
    xp = dbTask.xp || dbTask.xp_reward || xp;
  }

  return {
    id: dbTask.id,
    icon,
    title,
    desc,
    difficulty,
    xp,
    isCompleted: dbTask.is_completed,
    isExpired: dbTask.is_expired,
    expiresAt: dbTask.expires_at ? new Date(dbTask.expires_at).getTime() : undefined
  };
};

export const mapTaskToDb = (task: Task, userId: string) => {
  const serializedTitle = JSON.stringify({
    title: task.title,
    icon: task.icon,
    desc: task.desc,
    difficulty: task.difficulty,
    xp: task.xp
  });

  return {
    id: task.id,
    user_id: userId,
    title: serializedTitle,
    is_completed: task.isCompleted || false,
    is_expired: task.isExpired || false,
    expires_at: task.expiresAt ? new Date(task.expiresAt).toISOString() : new Date().toISOString(),
    icon: task.icon,
    description: task.desc,
    difficulty: task.difficulty,
    xp: task.xp
  };
};

export interface Task {
  id: string;
  icon: string;
  title: string;
  desc: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  xp: number;
  isCompleted?: boolean;
  isLocked?: boolean;
  expiresAt?: number;
  isExpired?: boolean;
}

export interface Badge {
  id: string;
  icon: string;
  title: string;
  desc: string;
  unlocked: boolean;
}

export interface FriendActivity {
  id: string;
  name: string;
  avatar: string;
  completed: boolean;
  time: string;
  streak: number;
  status: 'accepted' | 'pending_incoming' | 'pending_outgoing';
}

export interface HistoryLog {
  id: string;
  taskTitle: string;
  taskIcon: string;
  dateStr: string;
  timeTakenStr: string;
  xpGained: number;
  isCompleted?: boolean;
}

export interface Feedback {
  id: string;
  userId: string;
  username: string;
  rating: number;
  message: string;
  createdAt: number;
}

interface AppContextType {
  appState: AppStateMode;
  streak: number;
  rewardBalance: number;
  currentQuest: Task | null;
  setCurrentQuest: (task: Task) => void;
  questCompleted: boolean;
  questRevealed: boolean;
  timeElapsed: number; // in seconds
  timerActive: boolean;
  completionTimeStr: string;
  revealQuest: () => void;
  completeQuest: () => void;
  resetQuestState: () => void;
  timeOfDay: number; // minutes from midnight
  setTimeOfDay: (mins: number) => void;
  isClockRunning: boolean;
  setIsClockRunning: (running: boolean) => void;
  isCronRunning: boolean;
  setIsCronRunning: (running: boolean) => void;
  badges: Badge[];
  isLoggedIn: boolean;
  login: (username: string, targetUserId: string) => Promise<void>;
  logout: () => void;
  level: number;
  friends: FriendActivity[];
  historyLogs: HistoryLog[];
  acceptFriendRequest: (id: string) => void;
  rejectFriendRequest: (id: string) => void;
  sendFriendRequest: (name: string) => void;
  userName: string;
  userProfile: { country: string; state: string; city: string; gender: string };
  updateUserProfile: (name: string, country: string, state: string, city: string, gender: string) => void;
  questsCompletedTodayCount: number;
  maxQuestsAllowedToday: number;
  unlockExtraQuestViaAd: () => void;
  dailyQuestsQueue: Task[];
  currentQuestIndex: number;
  boostExtraQuest: () => void;
  setCustomQuestsQueue: (tasks: Task[]) => void;
  geminiApiKey: string;
  resendApiKey: string;
  saveApiKeys: (geminiKey: string, resendKey: string) => void;
  userId: string;
  hasIntroduced: boolean;
  setHasIntroduced: (val: boolean) => void;
  completeActiveTask: (taskId: string) => void;
  markTaskExpired: (taskId: string) => void;
  tasksCreatedAt: number;
  tasksExpired: boolean;
  feedbacks: Feedback[];
  addFeedback: (rating: number, message: string) => void;
  clearFeedbacks: () => void;
  isBoostUnlocked: boolean;
  addManualHistoryLog: (taskTitle: string, taskIcon: string, isCompleted: boolean) => void;
  selectActiveTaskIndex: (index: number) => void;
}

const DEFAULT_ONBOARDING_TASKS = (expiresTimestamp: number): Task[] => [
  {
    id: 'default_1',
    icon: '💧',
    title: 'Morning Hydration: Drink 2 glasses of water (5-10 mins)',
    desc: 'Hydrate your body with fresh water to awaken your digestion and cellular functions.',
    difficulty: 'EASY',
    xp: 100,
    isCompleted: false,
    isLocked: false,
    expiresAt: expiresTimestamp,
    isExpired: false
  },
  {
    id: 'default_2',
    icon: '🤸',
    title: 'Light Stretch: Do a 5-minute morning wake-up stretch',
    desc: 'Activate your joints and muscles with gentle body rotations and tipping stretches.',
    difficulty: 'EASY',
    xp: 120,
    isCompleted: false,
    isLocked: false,
    expiresAt: expiresTimestamp,
    isExpired: false
  }
];

const PLAYFUL_TASKS: Task[] = [
  // EASY Tasks (for Level <= 2)
  {
    id: '1',
    icon: '⏰',
    title: 'Wake up at 6 AM',
    desc: 'Wake up early with the rising sun. Takes 1 minute.',
    difficulty: 'EASY',
    xp: 100,
  },
  {
    id: '2',
    icon: '🧘',
    title: 'Do simple 5-min meditation',
    desc: 'Sit quietly and focus on your breathing. Takes 5 minutes.',
    difficulty: 'EASY',
    xp: 120,
  },
  {
    id: '3',
    icon: '🌵',
    title: 'Drink water immediately',
    desc: 'Rehydrate your body with a fresh glass of water. Takes 2 minutes.',
    difficulty: 'EASY',
    xp: 100,
  },
  {
    id: '7',
    icon: '🛏️',
    title: 'Make your bed neatly',
    desc: 'Arrange sheets and fluff pillows to start the day with order. Takes 3 minutes.',
    difficulty: 'EASY',
    xp: 110,
  },
  {
    id: '9',
    icon: '🪟',
    title: 'Open windows for fresh sunlight',
    desc: 'Let fresh air and sunlight flow into your room. Takes 2 minutes.',
    difficulty: 'EASY',
    xp: 100,
  },
  {
    id: '10',
    icon: '☀️',
    title: 'Blind the sun with your smile',
    desc: 'Face the morning light, close your eyes, and smile wide for 2 minutes.',
    difficulty: 'EASY',
    xp: 105,
  },

  // MEDIUM Tasks (for Level 3 to 5)
  {
    id: '4',
    icon: '🦒',
    title: 'Waking giraffe neck stretches',
    desc: 'Stand straight on your tiptoes, reach high, and stretch your neck. Takes 5 minutes.',
    difficulty: 'MEDIUM',
    xp: 130,
  },
  {
    id: '5',
    icon: '📵',
    title: '10-minute digital detox',
    desc: 'Avoid looking at phone screen or notifications. Takes 10 minutes.',
    difficulty: 'MEDIUM',
    xp: 150,
  },
  {
    id: '8',
    icon: '🧹',
    title: 'Tidy up one flat surface',
    desc: 'Clear clutter from your desk or flat surface. Takes 8 minutes.',
    difficulty: 'MEDIUM',
    xp: 140,
  },
  {
    id: '6',
    icon: '📝',
    title: 'Write 3 morning gratitude points',
    desc: 'Reflect and write down three things you are thankful for today. Takes 5 minutes.',
    difficulty: 'MEDIUM',
    xp: 130,
  },
  {
    id: '12',
    icon: '🤸',
    title: '5-minute full body warm-up',
    desc: 'Do light joint rotations and muscle activation stretches. Takes 5 minutes.',
    difficulty: 'MEDIUM',
    xp: 145,
  },

  // HARD Tasks (for Level >= 6)
  {
    id: '13',
    icon: '🏃',
    title: '10-minute morning shadow boxing',
    desc: 'Do shadow boxing and light jumping jacks to raise your heart rate. Takes 10 minutes.',
    difficulty: 'HARD',
    xp: 220,
  },
  {
    id: '14',
    icon: '🚿',
    title: '1-minute cold splash/face shock',
    desc: 'Splash cold water on your face or take a cold shower splash. Takes 5 minutes.',
    difficulty: 'HARD',
    xp: 250,
  },
  {
    id: '15',
    icon: '📋',
    title: 'Detail plan your entire day',
    desc: 'Write down your schedule, priority tasks, and time blocks. Takes 8 minutes.',
    difficulty: 'HARD',
    xp: 210,
  },
  {
    id: '16',
    icon: '📖',
    title: 'Read 3 pages of a book',
    desc: 'Read a book carefully, absorbing the text. Takes 7 minutes.',
    difficulty: 'HARD',
    xp: 230,
  },
  {
    id: '17',
    icon: '💪',
    title: '15 quick pushups & core hold',
    desc: 'Perform 15 clean pushups and a 1-minute plank. Takes 6 minutes.',
    difficulty: 'HARD',
    xp: 240,
  },
];

const getFilteredTasksByLevel = (pool: Task[], userLvl: number): Task[] => {
  let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY';
  if (userLvl >= 6) {
    difficulty = 'HARD';
  } else if (userLvl >= 3) {
    difficulty = 'MEDIUM';
  }
  const filtered = pool.filter(t => t.difficulty === difficulty);
  return filtered.length > 0 ? filtered : pool;
};

export const scaleTaskForDifficulty = (task: Task, streak: number): Task => {
  let title = task.title;
  let desc = task.desc;
  let xp = task.xp;

  if (streak > 0) {
    const scaleFactor = Math.min(3.0, 1.0 + streak * 0.15); // max 3x XP multiplier
    xp = Math.round(task.xp * scaleFactor);

    if (task.id === '1') {
      const wakeTime = streak > 3 ? '5:30 AM' : streak > 1 ? '5:45 AM' : '6:00 AM';
      title = `Wake up at ${wakeTime}`;
      desc = `Rise early with the morning sun. (Streak Level: ${streak})`;
    } else if (task.id === '2') {
      const mins = streak > 3 ? '15' : streak > 1 ? '10' : '5';
      title = `Do a ${mins}-min mindfulness meditation`;
      desc = `Sit quietly, close your eyes, and focus strictly on your breathing. (Streak Level: ${streak})`;
    } else if (task.id === '3') {
      const vol = streak > 3 ? '750ml lemon-infused water' : streak > 1 ? '500ml pure water' : '2 glasses of water';
      title = `Drink ${vol} immediately`;
      desc = `Rehydrate your organs and boost your morning energy. (Streak Level: ${streak})`;
    } else if (task.id === '7') {
      const detail = streak > 3 ? 'Make bed, organize pillows, and spray lavender mist' : streak > 1 ? 'Make bed and arrange all pillows neatly' : 'Make your bed neatly';
      title = detail;
    } else if (task.id === '9') {
      const time = streak > 3 ? '10 mins of deep breathing' : streak > 1 ? '5 mins of light sun basking' : 'fresh air flow';
      title = `Open windows and get sunlight (${time})`;
    } else if (task.id === '10') {
      const smileTime = streak > 3 ? '5 mins of mirror affirmations' : '3 mins of silent smiling';
      title = `Smile to the morning sun (${smileTime})`;
    } else if (task.id === '4') {
      const stretchTime = streak > 3 ? '12 minutes with shoulder rolls' : '8 minutes of neck extensions';
      title = `Giraffe neck stretches (${stretchTime})`;
    } else if (task.id === '5') {
      const detoxMins = streak > 3 ? '30' : '20';
      title = `${detoxMins}-minute strict digital detox`;
    } else if (task.id === '8') {
      const scope = streak > 3 ? 'deep clean one cabinet or drawer' : 'tidy up two flat surfaces';
      title = `Flat surface cleaning: ${scope}`;
    } else if (task.id === '6') {
      const count = streak > 3 ? '5 gratitude items and text a friend' : '5 morning gratitude points';
      title = `Write down ${count}`;
    } else if (task.id === '12') {
      const warmTime = streak > 3 ? '15-minute full warm-up' : '10-minute dynamic warm-up';
      title = `Perform a ${warmTime}`;
    } else if (task.id === '13') {
      const boxTime = streak > 3 ? '20-min shadow boxing with high-knees' : '15-min dynamic shadow boxing';
      title = `Morning cardio: ${boxTime}`;
    } else if (task.id === '14') {
      const showerTime = streak > 3 ? '5-minute cold shower' : '3-minute cold shower';
      title = `Take a ${showerTime}`;
    } else if (task.id === '15') {
      const planScope = streak > 3 ? 'Detail plan your day and block calendar slots' : 'Detail plan your day and set hourly reminders';
      title = planScope;
    } else if (task.id === '16') {
      const pageCount = streak > 3 ? '12 pages and write a summary' : '7 pages of a book';
      title = `Read ${pageCount}`;
    } else if (task.id === '17') {
      const counts = streak > 3 ? '35 pushups & 2 min plank' : '25 pushups & 1.5 min plank';
      title = `Strength boost: ${counts}`;
    }
  }

  return {
    ...task,
    title,
    desc,
    xp,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  };
};

export const generateDailyQuests = (userStreak: number, userLvl: number, previousQueue: Task[]): Task[] => {
  let pool = PLAYFUL_TASKS;
  
  // Exclude previously assigned tasks to ensure new ones are DIFFERENT
  const previousTitles = previousQueue.map(q => q.title);
  let availablePool = pool.filter(t => !previousTitles.includes(t.title));
  if (availablePool.length === 0) {
    availablePool = pool;
  }

  // Filter pool by progressive difficulty level (using streak/level max)
  const effectiveTier = Math.max(userLvl, userStreak);
  let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY';
  if (effectiveTier >= 6) {
    difficulty = 'HARD';
  } else if (effectiveTier >= 3) {
    difficulty = 'MEDIUM';
  }

  let filteredPool = availablePool.filter(t => t.difficulty === difficulty);
  if (filteredPool.length === 0) {
    filteredPool = pool.filter(t => t.difficulty === difficulty);
  }
  if (filteredPool.length === 0) {
    filteredPool = availablePool;
  }

  const randomIdx1 = Math.floor(Math.random() * filteredPool.length);
  let randomIdx2 = Math.floor(Math.random() * filteredPool.length);
  while (randomIdx2 === randomIdx1 && filteredPool.length > 1) {
    randomIdx2 = Math.floor(Math.random() * filteredPool.length);
  }

  const newQuests = filteredPool.length > 1 
    ? [filteredPool[randomIdx1], filteredPool[randomIdx2]] 
    : [filteredPool[randomIdx1]];

  return newQuests.map(q => {
    const freshId = generateUUID();
    const baseQuestCopy = { ...q, id: freshId };
    return scaleTaskForDifficulty(baseQuestCopy, userStreak);
  });
};

const INITIAL_BADGES: Badge[] = [
  { id: 'b1', icon: '🌵', title: 'Cactus Hydrator', desc: 'Drank water like a succulent', unlocked: true },
  { id: 'b2', icon: '☀️', title: 'Sun God Streak', desc: 'Achieved a 5-day morning streak', unlocked: true },
  { id: 'b3', icon: '🌅', title: 'Dawn Conqueror', desc: 'Completed a task before 7:00 AM', unlocked: false },
];

const INITIAL_FRIENDS: FriendActivity[] = [
  { id: '1', name: 'Sarah Miller', avatar: '👩‍🎤', completed: true, time: '3m 14s', streak: 8, status: 'accepted' },
  { id: '2', name: 'Jake Thorne', avatar: '👨‍🚀', completed: true, time: '5m 45s', streak: 4, status: 'accepted' },
  { id: '3', name: 'Emma Watson', avatar: '👩‍🎨', completed: false, time: '--', streak: 0, status: 'accepted' },
  { id: '4', name: 'Alex Rivera', avatar: '👨‍🎤', completed: true, time: '2m 08s', streak: 15, status: 'accepted' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = window.localStorage.getItem('solarhero_user_token');
      const storedId = window.localStorage.getItem('solarhero_user_id') || '';
      return !!token && isUuid(storedId);
    }
    return false;
  });
  const [streak, setStreak] = useState(0);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [dailyQuestsQueue, setDailyQuestsQueue] = useState<Task[]>([]);
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);

  const currentQuest = dailyQuestsQueue[currentQuestIndex] || null;

  const setCurrentQuest = (task: Task) => {
    setDailyQuestsQueue(prev => {
      const copy = [...prev];
      const taskWithUuid = isUuid(task.id) ? task : { ...task, id: generateUUID() };
      if (currentQuestIndex < copy.length) {
        copy[currentQuestIndex] = taskWithUuid;
      } else {
        copy.push(taskWithUuid);
      }
      return copy;
    });
  };
  const [questRevealed, setQuestRevealed] = useState(false);
  const [questCompleted, setQuestCompleted] = useState(false);
  
  // Timer states
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [completionTimeStr, setCompletionTimeStr] = useState('');

  // Clock variables
  const [timeOfDay, setTimeOfDayState] = useState<number>(360); // Default 6:00 AM (360 mins)
  const [isClockRunning, setIsClockRunning] = useState(true);

  const [badges, setBadgesState] = useState<Badge[]>(INITIAL_BADGES);
  const [userName, setUserName] = useState('');

  const [userProfile, setUserProfile] = useState({ country: '', state: '', city: '', gender: '' });

  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  });

  const [resendApiKey, setResendApiKey] = useState(() => {
    return process.env.EXPO_PUBLIC_RESEND_API_KEY || '';
  });
  const [userId, setUserId] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedId = window.localStorage.getItem('solarhero_user_id') || '';
      return isUuid(storedId) ? storedId : '';
    }
    return '';
  });

  const [hasIntroduced, setHasIntroducedState] = useState(true);

  const setHasIntroduced = (val: boolean) => {
    setHasIntroducedState(val);
    if (typeof window !== 'undefined' && window.localStorage) {
      const prefix = userId ? `solarhero_${userId}_` : 'solarhero_guest_';
      window.localStorage.setItem(`${prefix}has_introduced`, val ? 'true' : 'false');
    }
  };

  const [tasksCreatedAt, setTasksCreatedAt] = useState(Date.now());
  const [tasksExpired, setTasksExpired] = useState(false);

  useEffect(() => {
    const checkExpiry = () => {
      const remaining = tasksCreatedAt + 24 * 60 * 60 * 1000 - Date.now();
      setTasksExpired(remaining <= 0);
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [tasksCreatedAt]);

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const addFeedback = async (rating: number, message: string) => {
    if (!userId) return;

    const newFeedbackId = generateUUID();
    const newFeedback = {
      id: newFeedbackId,
      user_id: userId,
      rating,
      message,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('feedbacks')
      .insert(newFeedback);

    if (error) {
      console.error('Failed to save feedback to Supabase:', error);
      return;
    }

    setFeedbacks(prev => [
      {
        id: newFeedbackId,
        userId: userId,
        username: userName,
        rating,
        message,
        createdAt: Date.now()
      },
      ...prev
    ]);
  };

  const clearFeedbacks = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from('feedbacks')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to clear feedbacks in Supabase:', error);
      return;
    }
    setFeedbacks([]);
  };

  const addManualHistoryLog = (taskTitle: string, taskIcon: string, isCompleted: boolean) => {
    const newLog: HistoryLog = {
      id: generateUUID(),
      taskTitle: taskTitle,
      taskIcon: taskIcon,
      dateStr: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      timeTakenStr: isCompleted ? 'Completed' : 'Expired/Reset',
      xpGained: 0,
      isCompleted: isCompleted,
    };
    setHistoryLogs((prev) => [newLog, ...prev]);
  };

  const selectActiveTaskIndex = (index: number) => {
    setCurrentQuestIndex(index);
    if (typeof window !== 'undefined' && window.localStorage) {
      const prefix = userId ? `solarhero_${userId}_` : 'solarhero_guest_';
      window.localStorage.setItem(`${prefix}quest_index`, index.toString());
    }
  };

  const completeActiveTask = (taskId: string) => {
    setDailyQuestsQueue(prev => {
      const idx = prev.findIndex(t => t.id === taskId);
      if (idx === -1) return prev;
      const newQueue = prev.map((t, index) => {
        if (index === idx) {
          return { ...t, isCompleted: true };
        }
        if (index === idx + 1) {
          return { ...t, isLocked: false };
        }
        return t;
      });
      return newQueue;
    });
  };

  const markTaskExpired = (taskId: string) => {
    setDailyQuestsQueue(prev => {
      return prev.map(t => t.id === taskId ? { ...t, isExpired: true } : t);
    });
  };

  const saveApiKeys = (geminiKey: string, resendKey: string) => {
    setGeminiApiKey(geminiKey);
    setResendApiKey(resendKey);
  };

  const questsCompletedTodayCount = dailyQuestsQueue.filter(t => t.isCompleted).length;
  const maxQuestsAllowedToday = dailyQuestsQueue.length;
  const isBoostUnlocked = dailyQuestsQueue.length > 0 && dailyQuestsQueue.filter(t => !t.isExpired).every(t => t.isCompleted);

  const boostExtraQuest = () => {
    let pool = PLAYFUL_TASKS;
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedPersona = window.localStorage.getItem('solarhero_persona_tasks');
      if (savedPersona) {
        try { pool = JSON.parse(savedPersona); } catch (e) {}
      }
    }

    const existingIds = dailyQuestsQueue.map(q => q?.id);
    let available = pool.filter(q => !existingIds.includes(q.id));
    if (available.length === 0) {
      available = pool;
    }

    const baseTask = available[Math.floor(Math.random() * available.length)];
    const boostedTask = { 
      ...baseTask, 
      id: generateUUID(),
      isCompleted: false,
      isLocked: false 
    };

    setDailyQuestsQueue(prev => [...prev, boostedTask]);
  };

  const unlockExtraQuestViaAd = () => {
    boostExtraQuest();
  };

  const setCustomQuestsQueue = (tasks: Task[]) => {
    const mappedTasks = tasks.map((task) => ({
      ...task,
      id: generateUUID(),
      isCompleted: false,
      isLocked: false,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      isExpired: false
    }));
    setDailyQuestsQueue(mappedTasks);
    setCurrentQuestIndex(0);
    setQuestCompleted(false);
    setQuestRevealed(false);
    const now = Date.now();
    setTasksCreatedAt(now);
    setTasksExpired(false);
  };

  const [friends, setFriends] = useState<FriendActivity[]>([]);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);

  // Compute level from rewardBalance (points)
  const level = Math.floor(rewardBalance / 500) + 1;

  // Compute locked/active state based on simulated time (8 PM = 1200 mins to 5:59 AM = 359 mins is NIGHT)
  const hours = Math.floor(timeOfDay / 60);
  const isNightTime = hours >= 20 || hours < 6;
  const appState: AppStateMode = isNightTime ? 'LOCKED_NIGHT' : 'ACTIVE_DAY';

  // Fast forward simulated clock ticker
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isClockRunning) {
      timer = setInterval(() => {
        setTimeOfDayState((prev) => (prev + 10 >= 1440 ? 0 : prev + 10));
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isClockRunning]);

  // Handle midnight reset: when simulated time enters LOCKED_NIGHT, reset daily completions
  useEffect(() => {
    if (appState === 'LOCKED_NIGHT' && questCompleted) {
      dailyQuestsQueue.forEach((task) => {
        if (!task.isCompleted) {
          addManualHistoryLog(task.title, task.icon, false);
        }
      });

      setQuestCompleted(false);
      setQuestRevealed(false);
      setTimeElapsed(0);
      setCurrentQuestIndex(0);
      
      const newQueue = generateDailyQuests(streak, level, dailyQuestsQueue);
      setDailyQuestsQueue(newQueue);
    }
  }, [appState, level, streak]);

  // Real-world daily reset checker: runs on launch and resets state if the date changed
  useEffect(() => {
    const todayStr = new Date().toDateString();
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const lastActiveDate = window.localStorage.getItem('solarhero_last_active_date');
      if (lastActiveDate && lastActiveDate !== todayStr) {
        dailyQuestsQueue.forEach((task) => {
          if (!task.isCompleted) {
            addManualHistoryLog(task.title, task.icon, false);
          }
        });

        setQuestCompleted(false);
        setQuestRevealed(false);
        setTimeElapsed(0);
        setCurrentQuestIndex(0);

        const newQueue = generateDailyQuests(streak, level, dailyQuestsQueue);
        setDailyQuestsQueue(newQueue);
      }
      window.localStorage.setItem('solarhero_last_active_date', todayStr);
    }
  }, [level, streak]);

  // Ticking execution timer when task is active
  useEffect(() => {
    let ticker: NodeJS.Timeout;
    if (timerActive) {
      ticker = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(ticker);
  }, [timerActive]);

  // Sync state changes to localStorage (isolated cache)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const prefix = userId ? `solarhero_${userId}_` : 'solarhero_guest_';
      window.localStorage.setItem(`${prefix}streak`, streak.toString());
      window.localStorage.setItem(`${prefix}reward_balance`, rewardBalance.toString());
      if (currentQuest) {
        window.localStorage.setItem(`${prefix}current_quest_id`, currentQuest.id);
      }
      window.localStorage.setItem(`${prefix}quest_revealed`, questRevealed ? 'true' : 'false');
      window.localStorage.setItem(`${prefix}quest_completed`, questCompleted ? 'true' : 'false');
      window.localStorage.setItem(`${prefix}badges`, JSON.stringify(badges));
      window.localStorage.setItem(`${prefix}history_logs`, JSON.stringify(historyLogs));
      window.localStorage.setItem(`${prefix}friends`, JSON.stringify(friends));
    }
  }, [streak, rewardBalance, currentQuest, questRevealed, questCompleted, badges, historyLogs, friends, userId]);

  // Sync dailyQuestsQueue changes to Supabase tasks table
  useEffect(() => {
    if (!userId || dailyQuestsQueue.length === 0) return;

    const syncTasks = async () => {
      try {
        const upsertRows = dailyQuestsQueue.map(t => {
          const expiresTime = t.expiresAt || (Date.now() + 24 * 60 * 60 * 1000);
          return {
            id: t.id,
            user_id: userId,
            title: JSON.stringify({
              title: t.title,
              icon: t.icon,
              desc: t.desc,
              difficulty: t.difficulty,
              xp: t.xp
            }),
            is_completed: !!t.isCompleted,
            is_expired: !!t.isExpired,
            expires_at: new Date(expiresTime).toISOString()
          };
        });

        await supabase
          .from('tasks')
          .upsert(upsertRows, { onConflict: 'id' });
      } catch (e) {
        console.error('Failed to sync tasks queue to Supabase:', e);
      }
    };

    syncTasks();
  }, [dailyQuestsQueue, userId]);

  // Asynchronous User Data Loader from Supabase
  const loadUserData = async (targetUserId: string) => {
    if (!targetUserId) return;
    setIsDbLoading(true);
    try {
      // 1. Fetch user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();
      
      if (userError) throw userError;
      if (user) {
        setUserName(user.username);
        setUserProfile({
          country: user.country || '',
          state: user.state || '',
          city: user.city || '',
          gender: user.gender || 'Not Specified'
        });
      }

      // 2. Fetch user progress
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (progressError) throw progressError;

      if (progress) {
        setStreak(progress.streak);
        setRewardBalance(progress.points);
      } else {
        // Initialize progress row in DB if missing
        await supabase.from('user_progress').insert({
          user_id: targetUserId,
          points: 0,
          level: 1,
          streak: 0
        });
        setStreak(0);
        setRewardBalance(0);
      }

      // 3. Fetch user tasks
      const { data: dbTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      let finalQueue: Task[] = [];
      let activeIndex = 0;

      if (dbTasks && dbTasks.length > 0) {
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        // Filter to only include tasks created today, or that are not expired yet (active tasks carried over)
        const todayTasks = dbTasks.filter(t => {
          const createdTime = new Date(t.created_at).getTime();
          const expiresTime = new Date(t.expires_at).getTime();
          return createdTime >= startOfToday.getTime() || expiresTime > Date.now();
        });

        if (todayTasks.length > 0) {
          finalQueue = todayTasks.map(mapTaskFromDb);
          const firstUncompleted = finalQueue.findIndex(t => !t.isCompleted && !t.isExpired);
          activeIndex = firstUncompleted !== -1 ? firstUncompleted : finalQueue.length - 1;
        } else {
          // No tasks for today, generate new progressive tasks!
          const newQuests = generateDailyQuests(streak, level, []);
          finalQueue = newQuests;
          activeIndex = 0;
        }
      } else {
        // Create default onboarding tasks
        const expiresTime = Date.now() + 24 * 60 * 60 * 1000;
        const defaultTasks = DEFAULT_ONBOARDING_TASKS(expiresTime);
        const insertRows = defaultTasks.map(t => {
          const taskUuid = generateUUID();
          t.id = taskUuid; // Assign UUID
          return {
            id: taskUuid,
            user_id: targetUserId,
            title: JSON.stringify({
              title: t.title,
              icon: t.icon,
              desc: t.desc,
              difficulty: t.difficulty,
              xp: t.xp
            }),
            is_completed: false,
            is_expired: false,
            expires_at: new Date(expiresTime).toISOString()
          };
        });

        const { error: insertErr } = await supabase
          .from('tasks')
          .insert(insertRows);
        
        if (insertErr) throw insertErr;
        finalQueue = defaultTasks;
        activeIndex = 0;
      }

      setDailyQuestsQueue(finalQueue);
      setCurrentQuestIndex(activeIndex);

      const activeTask = finalQueue[activeIndex];
      if (activeTask) {
        setQuestCompleted(!!activeTask.isCompleted);
        
        // Restore questRevealed from local storage if available for this user
        const prefix = `solarhero_${targetUserId}_`;
        const savedRevealed = typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem(`${prefix}quest_revealed`) === 'true'
          : false;
        setQuestRevealed(activeTask.isCompleted ? true : savedRevealed);
      }

      // 4. Load feedbacks
      const { data: dbFeedbacks, error: feedbacksError } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (feedbacksError) throw feedbacksError;
      if (dbFeedbacks) {
        setFeedbacks(dbFeedbacks.map(f => ({
          id: f.id,
          userId: f.user_id,
          username: user?.username || 'user',
          rating: f.rating,
          message: f.message,
          createdAt: new Date(f.created_at).getTime()
        })));
      }

      // 5. Load history logs (all completed/expired tasks from tasks table)
      const { data: dbHistoryTasks, error: historyError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (dbHistoryTasks) {
        setHistoryLogs(dbHistoryTasks.map(t => {
          const mapped = mapTaskFromDb(t);
          return {
            id: t.id,
            taskTitle: mapped.title,
            taskIcon: mapped.icon,
            dateStr: new Date(t.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            timeTakenStr: t.is_completed ? 'Completed' : 'Expired/Reset',
            xpGained: t.is_completed ? mapped.xp : 0,
            isCompleted: t.is_completed
          };
        }));
      }

    } catch (e) {
      console.error('Error loading user data from Supabase:', e);
    } finally {
      setIsDbLoading(false);
    }
  };

  // Synchronously fetch and load user details when identity changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedId = window.localStorage.getItem('solarhero_user_id') || '';
      const storedToken = window.localStorage.getItem('solarhero_user_token');
      if (storedToken && !isUuid(storedId)) {
        console.warn('Invalid UUID stored in session. Clearing legacy session.');
        logout();
        return;
      }
    }

    if (userId) {
      loadUserData(userId);
    }
  }, [userId]);

  const login = async (username: string, targetUserId: string) => {
    setIsLoggedIn(true);
    setUserName(username);
    setUserId(targetUserId);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('solarhero_user_token', 'token-' + targetUserId);
      window.localStorage.setItem('solarhero_user_name', username);
      window.localStorage.setItem('solarhero_user_id', targetUserId);
    }
  };

  const logout = () => {
    // Completely flush all active context and memory state
    setIsLoggedIn(false);
    setUserId('');
    setUserName('');
    setUserProfile({ country: '', state: '', city: '', gender: '' });
    setStreak(0);
    setRewardBalance(0);
    setDailyQuestsQueue([]);
    setCurrentQuestIndex(0);
    setQuestRevealed(false);
    setQuestCompleted(false);
    setTimeElapsed(0);
    setTimerActive(false);
    setCompletionTimeStr('');
    setHistoryLogs([]);
    setFeedbacks([]);
    setFriends([]);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('solarhero_user_token');
      window.localStorage.removeItem('solarhero_user_email');
      window.localStorage.removeItem('solarhero_user_name');
      window.localStorage.removeItem('solarhero_user_id');
    }
  };

  const revealQuest = () => {
    setQuestRevealed(true);
    setTimerActive(true);
  };

  const completeQuest = () => {
    setTimerActive(false);
    setQuestCompleted(true);
    
    if (currentQuest) {
      completeActiveTask(currentQuest.id);
    }
    
    const newStreak = streak + 1;
    setStreak(newStreak);
    
    const newBalance = rewardBalance + (currentQuest?.xp || 100);
    setRewardBalance(newBalance);
    
    const mins = Math.floor(timeElapsed / 60);
    const secs = timeElapsed % 60;
    const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    setCompletionTimeStr(durationStr);

    setBadgesState((prevBadges) => {
      return prevBadges.map((badge) => {
        if (badge.id === 'b1' && currentQuest?.id === '1' && !badge.unlocked) {
          return { ...badge, unlocked: true };
        }
        if (badge.id === 'b2' && newStreak >= 5 && !badge.unlocked) {
          return { ...badge, unlocked: true };
        }
        if (badge.id === 'b3' && hours < 7 && !badge.unlocked) {
          return { ...badge, unlocked: true };
        }
        return badge;
      });
    });

    const newLog: HistoryLog = {
      id: generateUUID(),
      taskTitle: currentQuest?.title || '',
      taskIcon: currentQuest?.icon || '☀️',
      dateStr: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      timeTakenStr: durationStr,
      xpGained: currentQuest?.xp || 100,
      isCompleted: true
    };
    setHistoryLogs((prev) => [newLog, ...prev]);

    // Sync progress and completion to Supabase database backend
    const syncProgressAndTask = async () => {
      if (userId) {
        // Update user progress
        await supabase
          .from('user_progress')
          .update({
            points: newBalance,
            level: Math.floor(newBalance / 500) + 1,
            streak: newStreak
          })
          .eq('user_id', userId);

        // Update task completion in Supabase
        if (currentQuest) {
          await supabase
            .from('tasks')
            .update({ is_completed: true })
            .eq('id', currentQuest.id);
        }
      }
    };
    syncProgressAndTask();

    // Transition to next task if available in queue:
    if (currentQuestIndex + 1 < dailyQuestsQueue.length) {
      setTimeout(() => {
        setCurrentQuestIndex(prev => {
          const nextIdx = prev + 1;
          if (typeof window !== 'undefined' && window.localStorage) {
            const prefix = userId ? `solarhero_${userId}_` : 'solarhero_guest_';
            window.localStorage.setItem(`${prefix}quest_index`, nextIdx.toString());
          }
          return nextIdx;
        });
        setQuestCompleted(false);
        setQuestRevealed(true); 
        setTimeElapsed(0);
        setTimerActive(true); 
      }, 1500);
    } else {
      setTimerActive(false);
    }
  };

  const resetQuestState = () => {
    setQuestRevealed(false);
    setQuestCompleted(false);
    setTimeElapsed(0);
    setTimerActive(false);
  };

  const updateUserProfile = async (name: string, country: string, state: string, city: string, gender: string) => {
    setUserName(name);
    const newProfile = { country, state, city, gender };
    setUserProfile(newProfile);

    if (userId) {
      const { error } = await supabase
        .from('users')
        .update({
          username: name,
          country,
          state,
          city,
          gender
        })
        .eq('id', userId);

      if (error) {
        console.error('Failed to update user profile in Supabase:', error);
      }
    }
  };

  const acceptFriendRequest = (id: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'accepted' as const } : f))
    );
  };

  const rejectFriendRequest = (id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  const sendFriendRequest = (name: string) => {
    const avatars = ['👩‍🚀', '👨‍🚀', '👩‍🎨', '👨‍🎨', '👩‍🎤', '👨‍🎤'];
    const newFriend: FriendActivity = {
      id: generateUUID(),
      name: name,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      completed: false,
      time: '--',
      streak: 0,
      status: 'pending_outgoing' as const,
    };
    setFriends((prev) => [newFriend, ...prev]);
  };

  const setTimeOfDay = (mins: number) => {
    setTimeOfDayState(mins);
  };

  return (
    <AppContext.Provider
      value={{
        appState,
        streak,
        rewardBalance,
        currentQuest,
        setCurrentQuest,
        questCompleted,
        questRevealed,
        timeElapsed,
        timerActive,
        completionTimeStr,
        revealQuest,
        completeQuest,
        resetQuestState,
        timeOfDay,
        setTimeOfDay,
        isClockRunning,
        setIsClockRunning,
        isCronRunning: isClockRunning,
        setIsCronRunning: setIsClockRunning,
        badges,
        isLoggedIn,
        login,
        logout,
        level,
        friends,
        historyLogs,
        acceptFriendRequest,
        rejectFriendRequest,
        sendFriendRequest,
        userName,
        userProfile,
        updateUserProfile,
        questsCompletedTodayCount,
        maxQuestsAllowedToday,
        unlockExtraQuestViaAd,
        dailyQuestsQueue,
        currentQuestIndex,
        boostExtraQuest,
        setCustomQuestsQueue,
        geminiApiKey,
        resendApiKey,
        saveApiKeys,
        userId,
        hasIntroduced,
        setHasIntroduced,
        completeActiveTask,
        markTaskExpired,
        tasksCreatedAt,
        tasksExpired,
        feedbacks,
        addFeedback,
        clearFeedbacks,
        isBoostUnlocked,
        addManualHistoryLog,
        selectActiveTaskIndex,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
