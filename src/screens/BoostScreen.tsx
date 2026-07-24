import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { Play, Sparkles, AlertCircle, ShieldAlert, Award } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

import {
  isWeb,
  adUnitId,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  AdEventType,
} from '../services/AdMobService';

export const BoostScreen: React.FC = () => {
  const { theme, mode } = useTheme();
  const { questsCompletedTodayCount, maxQuestsAllowedToday, unlockExtraQuestViaAd, isBoostUnlocked } = useApp();

  const [adModalVisible, setAdModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [adFinished, setAdFinished] = useState(false);

  const [adLoaded, setAdLoaded] = useState(false);
  const [isAdBuffering, setIsAdBuffering] = useState(!isWeb);
  const [rewardedAdInstance, setRewardedAdInstance] = useState<any>(null);

  // Simulated timer ad fallback (e.g. for Web or while loading)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (adModalVisible && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (adModalVisible && countdown === 0 && !adFinished) {
      setAdFinished(true);
      unlockExtraQuestViaAd();
      Alert.alert("Task Limit Boosted!", "+1 Extra Task Added. 🚀");
    }
    return () => clearInterval(timer);
  }, [adModalVisible, countdown, adFinished]);

  // Real AdMob Rewarded Ad lifecycle
  useEffect(() => {
    if (isWeb || !RewardedAd || !RewardedAdEventType) {
      setIsAdBuffering(false);
      return;
    }

    try {
      const adInstance = RewardedAd.createForAdUnit(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubscribeLoaded = adInstance.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          setAdLoaded(true);
          setIsAdBuffering(false);
        }
      );

      const unsubscribeEarned = adInstance.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward: any) => {
          console.log('User earned reward:', reward);
          unlockExtraQuestViaAd();
          Alert.alert("Task Limit Boosted!", "+1 Extra Task Added. 🚀");
        }
      );

      const unsubscribeClosed = adInstance.addAdEventListener(
        (AdEventType && AdEventType.CLOSED) || 'closed',
        () => {
          setAdLoaded(false);
          setIsAdBuffering(true);
          adInstance.load();
        }
      );

      const unsubscribeError = adInstance.addAdEventListener(
        (AdEventType && AdEventType.ERROR) || 'error',
        (error: any) => {
          console.warn('AdMob loading failed:', error);
          setAdLoaded(false);
          setIsAdBuffering(false);
        }
      );

      setIsAdBuffering(true);
      adInstance.load();
      setRewardedAdInstance(adInstance);

      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeClosed();
        unsubscribeError();
      };
    } catch (err) {
      console.warn('AdMob setup failed:', err);
      setIsAdBuffering(false);
    }
  }, []);

  const handleWatchAd = () => {
    if (!isBoostUnlocked) {
      Alert.alert("Locked 🔒", "Please complete today's tasks first!");
      return;
    }

    if (isWeb) {
      // Fallback simulation mode
      setCountdown(5);
      setAdFinished(false);
      setAdModalVisible(true);
      return;
    }

    if (isAdBuffering) {
      Alert.alert("Ad loading", "Ad loading, please try in a moment.");
      return;
    }

    if (!rewardedAdInstance || !adLoaded) {
      Alert.alert("Ad loading", "Ad loading, please try in a moment.");
      // Retry loading the ad if it somehow missed
      if (rewardedAdInstance) {
        setIsAdBuffering(true);
        rewardedAdInstance.load();
      }
      return;
    }

    try {
      rewardedAdInstance.show();
    } catch (err) {
      console.warn('AdMob show failed, using fallback:', err);
      setCountdown(5);
      setAdFinished(false);
      setAdModalVisible(true);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>⚡ Quest Booster</Text>

      {/* Limits status card */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <Sparkles size={32} color={theme.primary} style={styles.cardIcon} />
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Daily Quest Slots</Text>
        <Text style={[styles.slotsText, { color: theme.primary }]}>
          {questsCompletedTodayCount} / {maxQuestsAllowedToday} Completed Today
        </Text>
        <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
          Morning task limits prevent burnout and maintain circadian health. By default, you can complete exactly 2 tasks per day.
        </Text>
      </View>

      {/* Watch Ad Booster Card */}
      <View style={[styles.boostCard, { backgroundColor: theme.cardBackground, borderColor: isBoostUnlocked ? '#FF7E5F' : theme.cardBorder }]}>
        <View style={styles.boostInfo}>
          <Text style={[styles.boostTitle, { color: theme.textPrimary }]}>
            📺 Watch Sponsor Ad {!isBoostUnlocked && '🔒 (Locked)'}
          </Text>
          <Text style={[styles.boostDesc, { color: theme.textSecondary }]}>
            Watch a quick sponsor video to unlock +1 additional quest slot for today.
          </Text>
          {!isBoostUnlocked && (
            <Text style={{ color: '#FF7E5F', fontSize: 10, fontWeight: 'bold', marginTop: 6 }}>
              ⚠️ Complete today's tasks first to unlock booster slot!
            </Text>
          )}
        </View>

        <TouchableOpacity 
          style={[
            styles.boostBtn, 
            { backgroundColor: isBoostUnlocked ? theme.primary : 'rgba(128, 128, 128, 0.15)' },
            ((isAdBuffering && !isWeb) || !isBoostUnlocked) && { opacity: 0.8 }
          ]} 
          onPress={handleWatchAd}
        >
          {isAdBuffering && !isWeb && isBoostUnlocked ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Play size={16} color={isBoostUnlocked ? '#FFF' : theme.textSecondary} fill={isBoostUnlocked ? '#FFF' : 'transparent'} />
          )}
          <Text style={[styles.boostBtnText, { color: isBoostUnlocked ? '#FFF' : theme.textSecondary }]}>
            {!isBoostUnlocked
              ? 'Locked 🔒'
              : isAdBuffering && !isWeb 
                ? 'Loading Sponsor Ad...' 
                : adLoaded 
                  ? 'Watch Ad & Boost' 
                  : 'Watch Sponsor Ad (Web/Sim)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Safety & Progressive Difficulty Card */}
      <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <ShieldAlert size={20} color={theme.secondary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>Progression & Safety Rule</Text>
          <Text style={[styles.infoDesc, { color: theme.textSecondary }]}>
            Tasks automatically scale in difficulty (Easy ➔ Medium ➔ Hard) as your level grows. All quests are medically verified to be non-harmful and safe for morning habit formatting.
          </Text>
        </View>
      </View>

      {/* Simulated Ad Player Modal */}
      <Modal visible={adModalVisible} transparent={true} animationType="fade">
        <View style={styles.adOverlay}>
          <View style={[styles.adContainer, { backgroundColor: '#0B0D14', borderColor: theme.cardBorder }]}>
            {!adFinished ? (
              <View style={styles.adContent}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.adHeadline}>📺 SolarHero Sponsor Ad Running...</Text>
                <Text style={styles.adTimer}>Unlocking extra quest in {countdown} seconds</Text>
                <Text style={styles.adSubtext}>Supporting free morning mental wellness tracking</Text>
              </View>
            ) : (
              <View style={styles.adContent}>
                <Award size={48} color="#00E676" />
                <Text style={[styles.adHeadline, { color: '#00E676' }]}>🎉 Booster Slot Unlocked!</Text>
                <Text style={styles.adTimer}>You can now complete +1 more task today!</Text>
                
                <TouchableOpacity
                  style={[styles.closeAdBtn, { backgroundColor: theme.primary }]}
                  onPress={() => setAdModalVisible(false)}
                >
                  <Text style={styles.closeAdBtnText}>Let's Play</Text>
                </TouchableOpacity>
              </View>
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
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  slotsText: {
    fontSize: 24,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  boostCard: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  boostInfo: {
    gap: 6,
  },
  boostTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  boostDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  boostBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  boostBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  adOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  adContainer: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
  },
  adContent: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  adHeadline: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  adTimer: {
    color: '#8A8F9E',
    fontSize: 13,
    textAlign: 'center',
  },
  adSubtext: {
    color: '#4C5161',
    fontSize: 11,
  },
  closeAdBtn: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  closeAdBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
