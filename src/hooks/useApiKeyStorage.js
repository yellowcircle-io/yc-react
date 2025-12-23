import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * useApiKeyStorage - Persist API keys with Firebase login
 *
 * When logged in: Stores keys in Firestore (encrypted in user's profile)
 * When anonymous: Falls back to localStorage
 *
 * Keys stored:
 * - groqApiKey: Groq LLM API key
 * - perplexityApiKey: Perplexity API key
 * - resendApiKey: Resend ESP API key
 * - openaiApiKey: OpenAI API key
 * - googleMapsApiKey: Google Maps JavaScript API key
 */

// Simple encryption for storing keys (not for security, just obfuscation)
// In production, use server-side encryption or a secrets manager
const OBFUSCATION_KEY = 'yc-api-keys-2025';

const obfuscate = (text) => {
  if (!text) return '';
  return btoa(text.split('').map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length))
  ).join(''));
};

const deobfuscate = (encoded) => {
  if (!encoded) return '';
  try {
    const decoded = atob(encoded);
    return decoded.split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length))
    ).join('');
  } catch {
    return '';
  }
};

export function useApiKeyStorage() {
  const { user, isAuthenticated } = useAuth();
  const [keys, setKeys] = useState({
    groqApiKey: '',
    perplexityApiKey: '',
    resendApiKey: '',
    openaiApiKey: '',
    googleMapsApiKey: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(null);

  // Load keys on mount and when auth state changes
  useEffect(() => {
    const loadKeys = async () => {
      setIsLoading(true);

      if (isAuthenticated && user?.uid) {
        // Load from Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const storedKeys = userData.apiKeys || {};

            setKeys({
              groqApiKey: deobfuscate(storedKeys.groqApiKey || ''),
              perplexityApiKey: deobfuscate(storedKeys.perplexityApiKey || ''),
              resendApiKey: deobfuscate(storedKeys.resendApiKey || ''),
              openaiApiKey: deobfuscate(storedKeys.openaiApiKey || ''),
              googleMapsApiKey: deobfuscate(storedKeys.googleMapsApiKey || '')
            });
            setLastSynced(new Date());
            console.log('✅ API keys loaded from Firestore');
          }
        } catch (error) {
          console.error('Failed to load API keys from Firestore:', error);
          // Fall back to localStorage
          loadFromLocalStorage();
        }
      } else {
        // Load from localStorage for anonymous users
        loadFromLocalStorage();
      }

      setIsLoading(false);
    };

    const loadFromLocalStorage = () => {
      try {
        setKeys({
          groqApiKey: localStorage.getItem('groq_api_key') || '',
          perplexityApiKey: localStorage.getItem('perplexity_api_key') || '',
          resendApiKey: localStorage.getItem('resend_api_key') || '',
          openaiApiKey: localStorage.getItem('openai_api_key') || '',
          googleMapsApiKey: localStorage.getItem('google_maps_api_key') || ''
        });
        console.log('📦 API keys loaded from localStorage');
      } catch (error) {
        console.error('Failed to load API keys from localStorage:', error);
      }
    };

    loadKeys();
  }, [isAuthenticated, user?.uid]);

  // Save a specific key
  const saveKey = useCallback(async (keyName, value) => {
    const newKeys = { ...keys, [keyName]: value };
    setKeys(newKeys);

    if (isAuthenticated && user?.uid) {
      // Save to Firestore
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          [`apiKeys.${keyName}`]: obfuscate(value)
        });
        setLastSynced(new Date());
        console.log(`✅ ${keyName} saved to Firestore`);
      } catch (error) {
        console.error(`Failed to save ${keyName} to Firestore:`, error);
        // Fall back to localStorage
        saveToLocalStorage(keyName, value);
      }
    } else {
      // Save to localStorage
      saveToLocalStorage(keyName, value);
    }
  }, [keys, isAuthenticated, user?.uid]);

  const saveToLocalStorage = (keyName, value) => {
    const localStorageKeys = {
      groqApiKey: 'groq_api_key',
      perplexityApiKey: 'perplexity_api_key',
      resendApiKey: 'resend_api_key',
      openaiApiKey: 'openai_api_key',
      googleMapsApiKey: 'google_maps_api_key'
    };

    try {
      if (value) {
        localStorage.setItem(localStorageKeys[keyName], value);
      } else {
        localStorage.removeItem(localStorageKeys[keyName]);
      }
      console.log(`📦 ${keyName} saved to localStorage`);
    } catch (error) {
      console.error(`Failed to save ${keyName} to localStorage:`, error);
    }
  };

  // Save all keys at once
  const saveAllKeys = useCallback(async (newKeys) => {
    setKeys(newKeys);

    if (isAuthenticated && user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          apiKeys: {
            groqApiKey: obfuscate(newKeys.groqApiKey || ''),
            perplexityApiKey: obfuscate(newKeys.perplexityApiKey || ''),
            resendApiKey: obfuscate(newKeys.resendApiKey || ''),
            openaiApiKey: obfuscate(newKeys.openaiApiKey || ''),
            googleMapsApiKey: obfuscate(newKeys.googleMapsApiKey || '')
          }
        });
        setLastSynced(new Date());
        console.log('✅ All API keys saved to Firestore');
      } catch (error) {
        console.error('Failed to save API keys to Firestore:', error);
        // Fall back to localStorage
        Object.entries(newKeys).forEach(([key, value]) => {
          saveToLocalStorage(key, value);
        });
      }
    } else {
      // Save to localStorage
      Object.entries(newKeys).forEach(([key, value]) => {
        saveToLocalStorage(key, value);
      });
    }
  }, [isAuthenticated, user?.uid]);

  // Clear all keys
  const clearKeys = useCallback(async () => {
    const emptyKeys = {
      groqApiKey: '',
      perplexityApiKey: '',
      resendApiKey: '',
      openaiApiKey: '',
      googleMapsApiKey: ''
    };
    setKeys(emptyKeys);

    if (isAuthenticated && user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { apiKeys: {} });
        console.log('✅ API keys cleared from Firestore');
      } catch (error) {
        console.error('Failed to clear API keys from Firestore:', error);
      }
    }

    // Also clear localStorage
    ['groq_api_key', 'perplexity_api_key', 'resend_api_key', 'openai_api_key', 'google_maps_api_key'].forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('📦 API keys cleared from localStorage');
  }, [isAuthenticated, user?.uid]);

  // Migrate localStorage keys to Firestore when user logs in
  const migrateLocalToCloud = useCallback(async () => {
    if (!isAuthenticated || !user?.uid) return false;

    const localKeys = {
      groqApiKey: localStorage.getItem('groq_api_key') || '',
      perplexityApiKey: localStorage.getItem('perplexity_api_key') || '',
      resendApiKey: localStorage.getItem('resend_api_key') || '',
      openaiApiKey: localStorage.getItem('openai_api_key') || '',
      googleMapsApiKey: localStorage.getItem('google_maps_api_key') || ''
    };

    const hasLocalKeys = Object.values(localKeys).some(k => k);
    if (!hasLocalKeys) return false;

    try {
      await saveAllKeys(localKeys);
      // Clear localStorage after successful migration
      ['groq_api_key', 'perplexity_api_key', 'resend_api_key', 'openai_api_key', 'google_maps_api_key'].forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('✅ API keys migrated from localStorage to Firestore');
      return true;
    } catch (error) {
      console.error('Failed to migrate API keys:', error);
      return false;
    }
  }, [isAuthenticated, user?.uid, saveAllKeys]);

  return {
    keys,
    isLoading,
    isCloudSynced: isAuthenticated,
    lastSynced,
    saveKey,
    saveAllKeys,
    clearKeys,
    migrateLocalToCloud,
    // Convenience getters
    groqApiKey: keys.groqApiKey,
    perplexityApiKey: keys.perplexityApiKey,
    resendApiKey: keys.resendApiKey,
    openaiApiKey: keys.openaiApiKey,
    googleMapsApiKey: keys.googleMapsApiKey
  };
}

export default useApiKeyStorage;
