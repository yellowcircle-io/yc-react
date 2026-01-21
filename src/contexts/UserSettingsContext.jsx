/**
 * User Settings Context
 *
 * Provides centralized user settings management with Firestore persistence.
 * Settings are loaded on authentication and can be updated/saved.
 *
 * @created 2026-01-18
 */
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

// ============================================================
// Default Settings
// ============================================================
const DEFAULT_SETTINGS = {
  // Profile
  displayName: '',
  marketingEmails: true,
  notificationEmails: true,

  // Sharing Notifications
  shareNotificationEmails: true, // Receive email when someone shares with you

  // Link Archiver
  linkArchiverView: 'all', // 'all', 'starred', 'recent'

  // Unity NOTES
  notesDefaultNode: 'textNode', // 'textNode', 'stickyNode', 'photoNode'
  notesShowGrid: false,

  // Appearance
  theme: 'system', // 'light', 'dark', 'system'
  sidebarCollapsed: false
};

// ============================================================
// Context
// ============================================================
const UserSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  saving: false,
  error: null,
  updateSettings: () => {},
  saveSettings: async () => {},
  resetSettings: () => {}
});

// ============================================================
// Provider
// ============================================================
export function UserSettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings from Firestore on user auth
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) {
        setSettings(DEFAULT_SETTINGS);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const settingsRef = doc(db, 'user_settings', user.uid);
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          // Merge with defaults to ensure all keys exist
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data,
            // Use displayName from auth if not in settings
            displayName: data.displayName || user.displayName || ''
          });
        } else {
          // First time - use defaults with user's display name
          setSettings({
            ...DEFAULT_SETTINGS,
            displayName: user.displayName || ''
          });
        }
      } catch (err) {
        console.error('Error loading user settings:', err);
        setError('Failed to load settings');
        // Fall back to defaults
        setSettings({
          ...DEFAULT_SETTINGS,
          displayName: user?.displayName || ''
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.uid, user?.displayName]);

  // Update settings (in memory, not persisted until save)
  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({
      ...prev,
      ...updates
    }));
    setHasUnsavedChanges(true);
    setError(null);
  }, []);

  // Save settings to Firestore
  const saveSettings = useCallback(async () => {
    if (!user?.uid) {
      setError('Must be logged in to save settings');
      return false;
    }

    try {
      setSaving(true);
      setError(null);

      const settingsRef = doc(db, 'user_settings', user.uid);
      await setDoc(settingsRef, {
        ...settings,
        userId: user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setHasUnsavedChanges(false);
      return true;
    } catch (err) {
      console.error('Error saving user settings:', err);
      setError('Failed to save settings');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.uid, settings]);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettings({
      ...DEFAULT_SETTINGS,
      displayName: user?.displayName || ''
    });
    setHasUnsavedChanges(true);
  }, [user?.displayName]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    settings,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    updateSettings,
    saveSettings,
    resetSettings
  }), [settings, loading, saving, error, hasUnsavedChanges, updateSettings, saveSettings, resetSettings]);

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================
export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within UserSettingsProvider');
  }
  return context;
}

export default UserSettingsContext;
