import { Platform } from 'react-native';

// Azure Entra B2C Config parameters
export const AZURE_CONFIG = {
  tenantId: 'f5865f0e-ab0c-497b-af8d-eef036ee85a4',
  clientId: 'PLACEHOLDER_AZURE_CLIENT_ID', // Setup in Entra ID Portal
  authority: 'https://login.microsoftonline.com/f5865f0e-ab0c-497b-af8d-eef036ee85a4',
  redirectUri: Platform.select({
    ios: 'msauth.com.morningtask://auth',
    android: 'msauth://com.morningtask/oauth2redirect',
    web: typeof window !== 'undefined' ? `${window.location.origin}/oauth2/callback` : 'http://localhost:8081/oauth2/callback',
  }),
  scopes: ['openid', 'profile', 'offline_access'],
};

// Secure local token storage abstraction (guarantees cross-platform compilation safety)
export const secureStoreToken = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      const encoded = btoa(value);
      localStorage.setItem(key, encoded);
    } else {
      // Lazy load SecureStore dynamically so we don't break web bundle imports
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.warn('SecureStore not available, falling back to local state:', error);
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }
};

export const secureGetToken = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      const val = localStorage.getItem(key);
      return val ? atob(val) : null;
    } else {
      const SecureStore = require('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }
};

export const secureDeleteToken = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

// Initiate OAuth2 PKCE login authorization flow
export const getAzureAuthorizationUrl = (state: string, codeChallenge: string): string => {
  const params = new URLSearchParams({
    client_id: AZURE_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: AZURE_CONFIG.redirectUri || '',
    scope: AZURE_CONFIG.scopes.join(' '),
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${AZURE_CONFIG.authority}/oauth2/v2.0/authorize?${params.toString()}`;
};
