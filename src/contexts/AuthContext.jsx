import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * AuthContext - Firebase Authentication with SSO support
 *
 * Provides:
 * - User state management
 * - Google/GitHub OAuth
 * - Email/password authentication
 * - User profile data in Firestore
 * - Credit system integration
 */

const AuthContext = createContext(null);

// OAuth providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Default credit allocation
const DEFAULT_CREDITS = {
  free_remaining: 3,
  premium_remaining: 0,
  total_used: 0
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create or update user profile in Firestore
  const syncUserProfile = async (firebaseUser) => {
    if (!firebaseUser) {
      setUserProfile(null);
      return null;
    }

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Update last login
      const profileData = userSnap.data();
      await setDoc(userRef, {
        ...profileData,
        lastLoginAt: serverTimestamp()
      }, { merge: true });
      setUserProfile(profileData);
      return profileData;
    } else {
      // Create new user profile
      const newProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        provider: firebaseUser.providerData[0]?.providerId || 'email',
        credits: DEFAULT_CREDITS,
        subscription: {
          tier: 'free',
          renewsAt: null
        },
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };

      await setDoc(userRef, newProfile);
      setUserProfile(newProfile);
      return newProfile;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          await syncUserProfile(firebaseUser);
        } catch (err) {
          console.error('Error syncing user profile:', err);
          setError(err.message);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user);
      return result.user;
    } catch (err) {
      console.error('Google sign-in error:', err);
      // Provide helpful error messages
      if (err.code === 'auth/configuration-not-found') {
        setError('Google Sign-In not configured. Enable it in Firebase Console → Authentication → Sign-in method → Google.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else {
        setError(err.message);
      }
      throw err;
    }
  };

  // Sign in with GitHub
  const signInWithGithub = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      await syncUserProfile(result.user);
      return result.user;
    } catch (err) {
      console.error('GitHub sign-in error:', err);
      // Provide helpful error messages
      if (err.code === 'auth/configuration-not-found') {
        setError('GitHub Sign-In not configured. Enable it in Firebase Console → Authentication → Sign-in method → GitHub.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else {
        setError(err.message);
      }
      throw err;
    }
  };

  // Sign in with email/password
  const signInWithEmail = async (email, password) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await syncUserProfile(result.user);
      return result.user;
    } catch (err) {
      console.error('Email sign-in error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Sign up with email/password
  const signUpWithEmail = async (email, password, displayName = '') => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name if provided
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }

      await syncUserProfile(result.user);
      return result.user;
    } catch (err) {
      console.error('Email sign-up error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign-out error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Password reset
  const resetPassword = async (email) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Clear error
  const clearError = () => setError(null);

  const value = {
    // State
    user,
    userProfile,
    loading,
    error,
    isAuthenticated: !!user,

    // Methods
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    clearError,

    // Re-sync profile (useful after credit changes)
    refreshProfile: () => user && syncUserProfile(user)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
