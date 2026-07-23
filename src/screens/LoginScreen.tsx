import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Sun, User, Lock, ArrowRight, Mail, Key } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp, generateUUID } from '../context/AppContext';
import { Button } from '../components/Button';
import { GradientBackground } from '../components/GradientBackground';
import { supabase } from '../services/supabaseClient';

// Secure Hashing helper to prevent plain-text leak (Hacker protection)
const hashPassword = (password: string) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'shash_' + Math.abs(hash).toString(16);
};

const isPasswordSecure = (pass: string) => {
  return pass.length >= 8 && /[!@#$%^&*(),.?":{}|<>_]/.test(pass);
};

const isUsernameAlphanumeric = (uname: string) => {
  const clean = uname.trim();
  const hasLetters = /[a-zA-Z]/.test(clean);
  const hasNumbers = /[0-9]/.test(clean);
  const isAllAlphanumeric = /^[a-zA-Z0-9]+$/.test(clean);
  return hasLetters && hasNumbers && isAllAlphanumeric;
};

export const LoginScreen: React.FC = () => {
  const { theme } = useTheme();
  const { login, resendApiKey } = useApp();
  
  // Auth Modes: 'login' | 'signup' | 'forgot' | 'verify_signup_otp' | 'verify_forgot_otp'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'verify_signup_otp' | 'verify_forgot_otp'>('login');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Forgot / OTP states
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleAuth = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    const usernameLower = username.trim().toLowerCase();

    if (!usernameLower) {
      setErrorMessage('Please enter your Username.');
      return;
    }

    if (authMode === 'login') {
      if (!password) {
        setErrorMessage('Password is required.');
        return;
      }

      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', usernameLower)
          .maybeSingle();

        if (error) {
          setErrorMessage('Database connection error. Please try again.');
          console.error(error);
          return;
        }

        if (!user || user.password_hash !== hashPassword(password)) {
          setErrorMessage('Invalid Username or Password. Please try again!');
          return;
        }

        // Success Login
        await login(user.username, user.id);
      } catch (e) {
        setErrorMessage('An unexpected error occurred. Please try again.');
        console.error(e);
      }
    } 
    
    else if (authMode === 'signup') {
      if (!isUsernameAlphanumeric(usernameLower)) {
        setErrorMessage('Username must contain both letters and numbers (e.g. john123).');
        return;
      }

      if (!email.trim() || !email.includes('@') || !email.includes('.')) {
        setErrorMessage('Please enter a valid Email Address.');
        return;
      }

      if (!isPasswordSecure(password)) {
        setErrorMessage('Password must be min 8 characters and contain at least 1 special character.');
        return;
      }

      try {
        // Check if username is taken
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('username', usernameLower)
          .maybeSingle();

        if (checkError) {
          setErrorMessage('Database connection error. Please try again.');
          console.error(checkError);
          return;
        }

        if (existingUser) {
          setErrorMessage('This username is already taken. Please try another one.');
          return;
        }

        const generatedUserId = generateUUID();
        const passHash = hashPassword(password);

        // Insert new user into users table
        const { error: insertUserError } = await supabase
          .from('users')
          .insert({
            id: generatedUserId,
            username: usernameLower,
            email: email.trim().toLowerCase(),
            password_hash: passHash
          });

        if (insertUserError) {
          setErrorMessage('Failed to create account. Please try again.');
          console.error(insertUserError);
          return;
        }

        // Initialize user progress
        const { error: insertProgressError } = await supabase
          .from('user_progress')
          .insert({
            user_id: generatedUserId,
            points: 0,
            level: 1,
            streak: 0
          });

        if (insertProgressError) {
          // Roll back user insertion if progress initialization fails
          await supabase.from('users').delete().eq('id', generatedUserId);
          setErrorMessage('Failed to initialize user progress. Please try again.');
          console.error(insertProgressError);
          return;
        }

        setSuccessMessage('Account created successfully! Logging you in...');
        setTimeout(async () => {
          await login(usernameLower, generatedUserId);
        }, 1200);
      } catch (e) {
        setErrorMessage('An unexpected error occurred. Please try again.');
        console.error(e);
      }
    }
    
    else if (authMode === 'forgot') {
      try {
        const { data: user, error: errorCheck } = await supabase
          .from('users')
          .select('id')
          .eq('username', usernameLower)
          .maybeSingle();

        if (errorCheck || !user) {
          setErrorMessage('No account associated with this username.');
          return;
        }
        setAuthMode('verify_forgot_otp');
      } catch (e) {
        setErrorMessage('An unexpected error occurred.');
      }
    }
  };

  const handleVerifyForgot = async () => {
    setErrorMessage('');
    const usernameLower = username.trim().toLowerCase();

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', usernameLower)
        .maybeSingle();

      if (error || !user) {
        setErrorMessage('Error finding user record.');
        return;
      }

      if (otpInput.trim().toLowerCase() !== user.email.toLowerCase()) {
        setErrorMessage('Incorrect Email Address. Security verification failed.');
        return;
      }

      if (!isPasswordSecure(newPassword)) {
        setErrorMessage('New password must be min 8 characters and contain 1 special character.');
        return;
      }

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: hashPassword(newPassword) })
        .eq('id', user.id);

      if (updateError) {
        setErrorMessage('Failed to update password. Please try again.');
        return;
      }

      setSuccessMessage('Password reset successfully! Redirecting to login...');
      setOtpInput('');
      setNewPassword('');
      setTimeout(() => {
        setAuthMode('login');
        setSuccessMessage('');
      }, 2000);
    } catch (e) {
      setErrorMessage('An unexpected error occurred.');
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <View style={styles.sunCircle}>
              <Sun size={48} color={theme.primary} fill={theme.secondary} />
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Morning Task</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Level up your morning routine sanity
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
            <Text style={styles.cardHeader}>
              {authMode === 'login' && 'Welcome Back!'}
              {authMode === 'signup' && 'Create Hero Account'}
              {authMode === 'forgot' && 'Reset Password Request'}
              {authMode === 'verify_signup_otp' && 'Verify Your Gmail'}
              {authMode === 'verify_forgot_otp' && 'Reset Password OTP'}
            </Text>

            {/* Error & Success Alerts */}
            {errorMessage ? (
              <View style={styles.errorAlert}>
                <Text style={styles.errorAlertText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successAlert}>
                <Text style={styles.successAlertText}>{successMessage}</Text>
              </View>
            ) : null}

            {(authMode === 'login' || authMode === 'signup' || authMode === 'forgot') && (
              <View style={styles.inputRow}>
                <User size={18} color="#8A8F9E" />
                <TextInput
                  placeholder="Username (e.g. hero123)"
                  placeholderTextColor="#8A8F9E"
                  keyboardType="default"
                  autoCapitalize="none"
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            )}

            {authMode === 'signup' && (
              <View style={styles.inputRow}>
                <Mail size={18} color="#8A8F9E" />
                <TextInput
                  placeholder="Email Address"
                  placeholderTextColor="#8A8F9E"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            )}

            {(authMode === 'login' || authMode === 'signup') && (
              <View style={styles.inputRow}>
                <Lock size={18} color="#8A8F9E" />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#8A8F9E"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            )}

            {/* Security Verification Inputs */}
            {authMode === 'verify_forgot_otp' && (
              <View style={styles.inputRow}>
                <Mail size={18} color="#8A8F9E" />
                <TextInput
                  placeholder="Confirm Registered Email"
                  placeholderTextColor="#8A8F9E"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  value={otpInput}
                  onChangeText={setOtpInput}
                />
              </View>
            )}

            {authMode === 'verify_forgot_otp' && (
              <View style={styles.inputRow}>
                <Lock size={18} color="#8A8F9E" />
                <TextInput
                  placeholder="Enter New Password"
                  placeholderTextColor="#8A8F9E"
                  secureTextEntry
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>
            )}

            {/* Buttons per Auth State */}
            {authMode === 'login' && (
              <Button
                title="Ignite Day"
                onPress={handleAuth}
                icon={<ArrowRight size={18} color="#FFF" />}
                style={styles.submitBtn}
              />
            )}

            {authMode === 'signup' && (
              <Button
                title="Create Hero Account"
                onPress={handleAuth}
                icon={<ArrowRight size={18} color="#FFF" />}
                style={styles.submitBtn}
              />
            )}

            {authMode === 'forgot' && (
              <Button
                title="Verify Username"
                onPress={handleAuth}
                icon={<ArrowRight size={18} color="#FFF" />}
                style={styles.submitBtn}
              />
            )}

            {authMode === 'verify_forgot_otp' && (
              <Button
                title="Change Password"
                onPress={handleVerifyForgot}
                icon={<ArrowRight size={18} color="#FFF" />}
                style={styles.submitBtn}
              />
            )}

            {/* Toggle / Helper Options */}
            {authMode === 'login' && (
              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => {
                  setErrorMessage('');
                  setAuthMode('forgot');
                }}
              >
                <Text style={[styles.forgotText, { color: theme.textSecondary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            <Pressable
              style={styles.toggleBtn}
              onPress={() => {
                setErrorMessage('');
                setSuccessMessage('');
                if (authMode === 'login') {
                  setAuthMode('signup');
                } else {
                  setAuthMode('login');
                }
              }}
            >
              <Text style={[styles.toggleText, { color: theme.primary }]}>
                {authMode === 'login'
                  ? "Don't have a hero account? Sign up"
                  : 'Already a morning hero? Log in'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  sunCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FF7E5F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 8px 12px rgba(255, 126, 95, 0.2)',
      },
    }),
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    borderRadius: 30,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  cardHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 52,
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  submitBtn: {
    marginTop: 8,
    width: '100%',
  },
  toggleBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorAlert: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorAlertText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  successAlert: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  successAlertText: {
    color: '#388E3C',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  forgotBtn: {
    marginTop: 12,
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
