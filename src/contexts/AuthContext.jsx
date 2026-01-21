/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { createLead } from '../utils/firestoreLeads';
import { sendLeadCapture } from '../config/integrations';

/**
 * AuthContext - Firebase Authentication with SSO support
 *
 * Provides:
 * - User state management
 * - Google/GitHub OAuth
 * - Email/password authentication
 * - User profile data in Firestore
 * - Credit system integration
 * - Firestore-based client whitelist (programmatic access control)
 *
 * Client Access Provisioning:
 * - Clients are stored in Firestore: config/client_whitelist
 * - Admin emails are stored in Firestore: config/admin_whitelist
 * - Add clients via Firebase Console or admin API
 * - Structure: { emails: ['client@company.com', 'team@agency.com'] }
 */

const AuthContext = createContext(null);

// OAuth providers
const googleProvider = new GoogleAuthProvider();

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

// Premium client allocation (unlimited)
const CLIENT_CREDITS = {
  free_remaining: 999,
  premium_remaining: 999,
  total_used: 0
};

// Fallback admin emails (always have access, even if Firestore fails)
const FALLBACK_ADMIN_EMAILS = [
  'christopher@yellowcircle.io',
  'info@yellowcircle.io',
  'arscooper@live.com',
  'christopher.ramon.cooper@gmail.com',
];

// Cache for whitelist (loaded from Firestore on init)
let clientWhitelistCache = [];
let adminWhitelistCache = FALLBACK_ADMIN_EMAILS.map(e => e.toLowerCase().trim());
let whitelistLoaded = false;

// Load whitelist from Firestore
const loadWhitelist = async () => {
  if (whitelistLoaded) return;

  try {
    // Load client whitelist
    const clientDoc = await getDoc(doc(db, 'config', 'client_whitelist'));
    if (clientDoc.exists()) {
      const data = clientDoc.data();
      clientWhitelistCache = (data.emails || []).map(e => e.toLowerCase().trim());
      console.log(`✅ Loaded ${clientWhitelistCache.length} client emails from Firestore`);
    }

    // Load admin whitelist (merge with fallback)
    const adminDoc = await getDoc(doc(db, 'config', 'admin_whitelist'));
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      const firestoreAdmins = (data.emails || []).map(e => e.toLowerCase().trim());
      // Merge with fallback (already lowercase), deduplicate
      const fallbackLower = FALLBACK_ADMIN_EMAILS.map(e => e.toLowerCase().trim());
      adminWhitelistCache = [...new Set([...fallbackLower, ...firestoreAdmins])];
      console.log(`✅ Loaded ${adminWhitelistCache.length} admin emails`);
    }

    whitelistLoaded = true;
  } catch (err) {
    console.warn('Could not load whitelist from Firestore, using fallback:', err.message);
    // Keep using fallback admins
  }
};

// Check if email qualifies for premium tier (client or admin)
const isClientEmail = (email) => {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return clientWhitelistCache.includes(normalizedEmail) || adminWhitelistCache.includes(normalizedEmail);
};

// Check if email is admin
const isAdminEmail = (email) => {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return adminWhitelistCache.includes(normalizedEmail);
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

    // Load whitelist from Firestore before checking
    await loadWhitelist();

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    // Determine tier based on email whitelist
    const userEmail = firebaseUser.email;
    const isClient = isClientEmail(userEmail);
    const isAdmin = isAdminEmail(userEmail);
    const autoTier = isClient ? 'premium' : 'free';
    const autoScope = isAdmin ? 'admin' : (isClient ? 'client' : 'user');

    // Debug logging
    console.log('🔍 Auth check:', {
      email: userEmail,
      isAdmin,
      isClient,
      autoScope,
      autoTier,
      adminCache: adminWhitelistCache
    });

    if (userSnap.exists()) {
      // Update last login and potentially upgrade tier
      const profileData = userSnap.data();

      // Check if user should be upgraded to premium (client/admin email)
      const currentTier = profileData.subscription?.tier || 'free';
      const shouldUpgrade = isClient && currentTier !== 'premium';

      const updateData = {
        ...profileData,
        lastLoginAt: serverTimestamp(),
        // Update scope if admin/client (always update for admins)
        ...((isAdmin || isClient) && { scope: autoScope }),
        // Upgrade to premium if admin or client email (don't downgrade existing premium users)
        ...((isAdmin || shouldUpgrade) && {
          subscription: { tier: 'premium', renewsAt: null },
          credits: CLIENT_CREDITS
        })
      };

      await setDoc(userRef, updateData, { merge: true });

      // Refresh profile data after update
      const updatedSnap = await getDoc(userRef);
      const updatedProfile = updatedSnap.data();
      setUserProfile(updatedProfile);

      // Log upgrade for visibility
      if (isAdmin || shouldUpgrade) {
        console.log(`✅ User ${userEmail} upgraded to premium (${isAdmin ? 'admin' : 'client'} whitelist)`);
      }

      return updatedProfile;
    } else {
      // Create new user profile with appropriate tier
      // Admins and clients both get premium tier and full credits
      const isPremiumUser = isAdmin || isClient;
      const newProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        provider: firebaseUser.providerData[0]?.providerId || 'email',
        credits: isPremiumUser ? CLIENT_CREDITS : DEFAULT_CREDITS,
        subscription: {
          tier: isPremiumUser ? 'premium' : 'free',
          renewsAt: null
        },
        scope: autoScope,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };

      await setDoc(userRef, newProfile);
      setUserProfile(newProfile);

      // Log new client/admin
      if (isPremiumUser) {
        console.log(`✅ New ${autoScope} user created: ${userEmail} (premium tier)`);
      }

      // Create lead for new SSO signup (triggers journey enrollment + notifications)
      try {
        await createLead({
          email: firebaseUser.email,
          submittedData: {
            name: firebaseUser.displayName || '',
            provider: firebaseUser.providerData[0]?.providerId || 'unknown'
          },
          source: 'sso',
          sourceForm: 'google_auth',
          metadata: {
            uid: firebaseUser.uid,
            isNewUser: true,
            tier: isPremiumUser ? 'premium' : 'free',
            scope: autoScope
          }
        });
        console.log(`✅ Lead created for new SSO user: ${userEmail}`);

        // Also send to n8n for Slack notification (fire and forget)
        sendLeadCapture(
          { email: firebaseUser.email, name: firebaseUser.displayName || '' },
          'sso_signup',
          'New SSO Signup'
        );
      } catch (leadErr) {
        console.error('Failed to create lead for SSO user:', leadErr);
        // Don't fail auth if lead creation fails
      }

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

  // Admin: Add client email to whitelist
  const addClientEmail = async (email) => {
    if (userProfile?.scope !== 'admin') {
      throw new Error('Admin access required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const clientRef = doc(db, 'config', 'client_whitelist');
    const clientDoc = await getDoc(clientRef);

    const currentEmails = clientDoc.exists() ? (clientDoc.data().emails || []) : [];
    if (currentEmails.includes(normalizedEmail)) {
      return { success: true, message: 'Email already in whitelist' };
    }

    await setDoc(clientRef, {
      emails: [...currentEmails, normalizedEmail],
      updatedAt: serverTimestamp(),
      updatedBy: user.email
    });

    // Update cache
    clientWhitelistCache.push(normalizedEmail);
    console.log(`✅ Added ${normalizedEmail} to client whitelist`);
    return { success: true, message: `Added ${normalizedEmail} to client whitelist` };
  };

  // Admin: Remove client email from whitelist
  const removeClientEmail = async (email) => {
    if (userProfile?.scope !== 'admin') {
      throw new Error('Admin access required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const clientRef = doc(db, 'config', 'client_whitelist');
    const clientDoc = await getDoc(clientRef);

    if (!clientDoc.exists()) {
      return { success: false, message: 'Whitelist not found' };
    }

    const currentEmails = clientDoc.data().emails || [];
    const updatedEmails = currentEmails.filter(e => e !== normalizedEmail);

    await setDoc(clientRef, {
      emails: updatedEmails,
      updatedAt: serverTimestamp(),
      updatedBy: user.email
    });

    // Update cache
    clientWhitelistCache = clientWhitelistCache.filter(e => e !== normalizedEmail);
    console.log(`✅ Removed ${normalizedEmail} from client whitelist`);
    return { success: true, message: `Removed ${normalizedEmail} from client whitelist` };
  };

  // Admin: Get current whitelist
  const getClientWhitelist = async () => {
    await loadWhitelist();
    return {
      clients: [...clientWhitelistCache],
      admins: [...adminWhitelistCache]
    };
  };

  // Admin: Upgrade user to premium by UID or email
  const upgradeUserToPremium = async (targetUidOrEmail) => {
    if (userProfile?.scope !== 'admin') {
      throw new Error('Admin access required');
    }

    // If email provided, find user by email
    let targetUid = targetUidOrEmail;
    if (targetUidOrEmail.includes('@')) {
      // Search for user by email (would need a query, for now just add to whitelist)
      await addClientEmail(targetUidOrEmail);
      return { success: true, message: `Added ${targetUidOrEmail} to client whitelist. They will get premium on next login.` };
    }

    // Direct UID upgrade
    const targetRef = doc(db, 'users', targetUid);
    const targetSnap = await getDoc(targetRef);

    if (!targetSnap.exists()) {
      throw new Error('User not found');
    }

    await setDoc(targetRef, {
      subscription: { tier: 'premium', renewsAt: null },
      credits: CLIENT_CREDITS,
      scope: 'client',
      upgradedAt: serverTimestamp(),
      upgradedBy: user.email
    }, { merge: true });

    console.log(`✅ Upgraded user ${targetUid} to premium`);
    return { success: true, message: `Upgraded user to premium` };
  };

  // Memoize refreshProfile callback to prevent unnecessary re-renders
  const refreshProfile = useCallback(() => user && syncUserProfile(user), [user]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    // State
    user,
    userProfile,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: userProfile?.scope === 'admin',

    // Methods
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    clearError,

    // Re-sync profile (useful after credit changes)
    refreshProfile,

    // Admin methods (client provisioning)
    addClientEmail,
    removeClientEmail,
    getClientWhitelist,
    upgradeUserToPremium
  }), [
    user, userProfile, loading, error, refreshProfile,
    signInWithGoogle, signInWithEmail, signUpWithEmail, signOut,
    resetPassword, clearError, addClientEmail, removeClientEmail,
    getClientWhitelist, upgradeUserToPremium
  ]);

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
