import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, StatusBar, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { Flame, LogOut, MessageSquare } from 'lucide-react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AppProvider, useApp } from './src/context/AppContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { BottomTab } from './src/navigation/BottomTab';
import { GradientBackground } from './src/components/GradientBackground';

function MainAppShell() {
  const { theme, mode, setThemeMode } = useTheme();
  const {
    isLoggedIn,
    logout,
    streak,
    level,
    timeOfDay,
    userName,
    userProfile,
    updateUserProfile,
    feedbacks,
    addFeedback,
    clearFeedbacks,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'today' | 'aicoach' | 'boost' | 'history' | 'leaderboard'>('today');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);

  const [editName, setEditName] = useState(userName);
  const [editCountry, setEditCountry] = useState(userProfile?.country || '');
  const [editState, setEditState] = useState(userProfile?.state || '');
  const [editCity, setEditCity] = useState(userProfile?.city || '');
  const [editGender, setEditGender] = useState(userProfile?.gender || 'Not Specified');

  // Automatic day/night theme sync disabled per user request to prevent color change at night

  useEffect(() => {
    if (isProfileModalOpen) {
      setEditName(userName);
      setEditCountry(userProfile?.country || '');
      setEditState(userProfile?.state || '');
      setEditCity(userProfile?.city || '');
      setEditGender(userProfile?.gender || 'Not Specified');
    }
  }, [isProfileModalOpen, userName, userProfile]);

  const handleSave = () => {
    updateUserProfile(editName, editCountry, editState, editCity, editGender);
    setIsProfileModalOpen(false);
  };

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Global Header Bar - Rendered ONLY if activeTab is 'leaderboard' */}
        {activeTab === 'leaderboard' && (
          <SafeAreaView style={[styles.headerSafeArea, { backgroundColor: mode === 'day' ? 'transparent' : '#1E1B2C' }]}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.userInfo} onPress={() => setIsProfileModalOpen(true)}>
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <Text style={styles.avatarEmoji}>🦸‍♂️</Text>
                </View>
                <View>
                  <Text style={[styles.userName, { color: mode === 'day' ? '#1E293B' : '#FFFFFF' }]}>{userName}</Text>
                  <Text style={[styles.userLevel, { color: theme.secondary }]}>Lvl {level} Sun Seeker ⚙️</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.headerControls}>
                <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 126, 95, 0.15)', borderColor: theme.primary }]}>
                  <Flame size={14} color={theme.primary} fill={theme.primary} />
                  <Text style={[styles.streakText, { color: theme.primary }]}>{streak}</Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                  onPress={() => setIsFeedbackModalOpen(true)}
                >
                  <MessageSquare size={16} color={mode === 'day' ? '#1E293B' : '#FFFFFF'} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        )}

        {/* Profile Modal */}
        <Modal
          visible={isProfileModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsProfileModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: mode === 'day' ? '#FFFFFF' : '#11141E', borderColor: theme.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>👤 Edit Profile Settings</Text>

              <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%', maxHeight: 380 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Full Name</Text>
                <TextInput
                  style={[styles.modalInput, { borderColor: theme.cardBorder, color: theme.textPrimary, backgroundColor: mode === 'day' ? '#F8FAFC' : 'rgba(255,255,255,0.04)' }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter name"
                  placeholderTextColor={theme.textSecondary}
                />

                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Country</Text>
                <TextInput
                  style={[styles.modalInput, { borderColor: theme.cardBorder, color: theme.textPrimary, backgroundColor: mode === 'day' ? '#F8FAFC' : 'rgba(255,255,255,0.04)' }]}
                  value={editCountry}
                  onChangeText={setEditCountry}
                  placeholder="e.g. India"
                  placeholderTextColor={theme.textSecondary}
                />

                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>State</Text>
                <TextInput
                  style={[styles.modalInput, { borderColor: theme.cardBorder, color: theme.textPrimary, backgroundColor: mode === 'day' ? '#F8FAFC' : 'rgba(255,255,255,0.04)' }]}
                  value={editState}
                  onChangeText={setEditState}
                  placeholder="e.g. Maharashtra"
                  placeholderTextColor={theme.textSecondary}
                />

                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>City</Text>
                <TextInput
                  style={[styles.modalInput, { borderColor: theme.cardBorder, color: theme.textPrimary, backgroundColor: mode === 'day' ? '#F8FAFC' : 'rgba(255,255,255,0.04)' }]}
                  value={editCity}
                  onChangeText={setEditCity}
                  placeholder="e.g. Mumbai"
                  placeholderTextColor={theme.textSecondary}
                />

                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Gender</Text>
                <View style={styles.genderRow}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        { borderColor: theme.cardBorder, backgroundColor: editGender === g ? theme.primary : 'rgba(0,0,0,0.1)' },
                      ]}
                      onPress={() => setEditGender(g)}
                    >
                      <Text style={[styles.genderBtnText, { color: editGender === g ? '#FFF' : theme.textPrimary }]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.logoutModalBtn, { backgroundColor: '#FF4B4B', borderColor: '#FF4B4B' }]}
                onPress={() => {
                  setIsProfileModalOpen(false);
                  logout();
                }}
              >
                <LogOut size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.logoutModalBtnText}>Logout Account</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.cardBorder, borderWidth: 1 }]}
                  onPress={() => setIsProfileModalOpen(false)}
                >
                  <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSave}
                >
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Feedback Modal */}
        <Modal
          visible={isFeedbackModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsFeedbackModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: mode === 'day' ? '#FFFFFF' : '#11141E', borderColor: theme.cardBorder, maxHeight: '80%' }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>💬 Submit App Feedback</Text>
              
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 8 }]}>
                Share your ideas, suggestions, or reports with the creators!
              </Text>
              
              <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 13, marginTop: 8, marginBottom: 6 }}>
                Your Rating:
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 15,
                      borderWidth: 1,
                      borderColor: feedbackRating === star ? theme.primary : theme.cardBorder,
                      backgroundColor: feedbackRating === star ? 'rgba(0, 145, 234, 0.15)' : 'transparent',
                    }}
                    onPress={() => setFeedbackRating(star)}
                  >
                    <Text style={{ color: feedbackRating === star ? theme.primary : theme.textPrimary, fontWeight: 'bold', fontSize: 13 }}>
                      ⭐ {star}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[
                  styles.modalInput, 
                  { 
                    borderColor: theme.cardBorder, 
                    color: theme.textPrimary, 
                    backgroundColor: mode === 'day' ? '#F8FAFC' : 'rgba(255,255,255,0.04)',
                    height: 80,
                    textAlignVertical: 'top',
                    paddingTop: 10,
                  }
                ]}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Type your message here..."
                placeholderTextColor={theme.textSecondary}
                multiline={true}
              />
              
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 20 }}>
                <TouchableOpacity
                  style={[styles.modalBtn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.cardBorder, borderWidth: 1 }]}
                  onPress={() => setIsFeedbackModalOpen(false)}
                >
                  <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { flex: 1, backgroundColor: theme.primary }]}
                  onPress={() => {
                    if (!feedbackText.trim()) {
                      Alert.alert("Error", "Please type some feedback before submitting! ⚠️");
                      return;
                    }
                    addFeedback(feedbackRating, feedbackText);
                    setFeedbackText('');
                    setFeedbackRating(5); // reset
                    Alert.alert("Feedback Submitted", "Thank you! Your feedback has been saved and is displayed in the developer console below. 🚀");
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Submit</Text>
                </TouchableOpacity>
              </View>

              {/* Developer / Creator View: Feedback Logs */}
              <View style={[styles.developerConsole, { borderTopColor: theme.cardBorder, borderTopWidth: 1, paddingTop: 16, width: '100%', flex: 1 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={[styles.developerTitle, { color: theme.primary, fontWeight: 'bold' }]}>
                    🛠️ Creator View: Feedback Received
                  </Text>
                  {feedbacks.length > 0 && (
                    <TouchableOpacity onPress={clearFeedbacks}>
                      <Text style={{ color: '#FF4B4B', fontSize: 11, fontWeight: 'bold' }}>Clear Logs</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {feedbacks.length === 0 ? (
                  <Text style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginVertical: 20 }}>
                    No feedbacks received yet. Submissions will appear here!
                  </Text>
                ) : (
                  <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
                    {feedbacks.map((f) => (
                      <View key={f.id} style={[styles.feedbackLogCard, { backgroundColor: mode === 'day' ? '#F1F5F9' : 'rgba(255,255,255,0.02)', borderColor: theme.cardBorder }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 12 }}>👤 {f.username} (⭐ {f.rating}/5)</Text>
                          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>
                            {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <Text style={{ color: theme.textPrimary, fontSize: 11, lineHeight: 15 }}>
                          {f.message}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Core Custom BottomTab Navigator */}
        <BottomTab activeTab={activeTab} setActiveTab={setActiveTab} />
      </View>
    </GradientBackground>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <MainAppShell />
      </AppProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSafeArea: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userLevel: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  modalInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginTop: 6,
    marginBottom: 16,
  },
  genderBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutModalBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  logoutModalBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  developerConsole: {
    width: '100%',
  },
  developerTitle: {
    fontSize: 12,
  },
  feedbackLogCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
});
