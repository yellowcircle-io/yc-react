/**
 * useCredits - Credit management hook with Firestore persistence
 *
 * Features:
 * - Firestore-backed credits for authenticated users
 * - localStorage fallback for anonymous users
 * - Tiered credit system: free (3), API key (10), premium (unlimited)
 * - Real-time sync with user profile
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

// Credit tiers
const FREE_CREDITS = 3;
const API_KEY_CREDITS = 10;

/**
 * useCredits hook
 *
 * @returns {Object} Credit state and methods
 */
export function useCredits() {
  const { user, userProfile, refreshProfile } = useAuth();

  // Local state for anonymous users
  const [localCredits, setLocalCredits] = useState(() => {
    const saved = localStorage.getItem('outreach_free_credits');
    return saved !== null ? parseInt(saved, 10) : FREE_CREDITS;
  });

  const [apiKeyCredits, setApiKeyCredits] = useState(() => {
    const saved = localStorage.getItem('outreach_apikey_credits');
    return saved !== null ? parseInt(saved, 10) : API_KEY_CREDITS;
  });

  const [loading, setLoading] = useState(false);

  // Get credits from profile or local storage
  const getCredits = useCallback(() => {
    if (user && userProfile) {
      return {
        freeRemaining: userProfile.credits?.free_remaining ?? 0,
        premiumRemaining: userProfile.credits?.premium_remaining ?? 0,
        totalUsed: userProfile.credits?.total_used ?? 0,
        tier: userProfile.subscription?.tier ?? 'free',
        isAuthenticated: true
      };
    }

    return {
      freeRemaining: localCredits,
      premiumRemaining: 0,
      totalUsed: 0,
      tier: 'anonymous',
      isAuthenticated: false
    };
  }, [user, userProfile, localCredits]);

  // Use a credit (decrement)
  const useCredit = useCallback(async (isApiKey = false) => {
    if (user && userProfile) {
      // Authenticated user - update Firestore
      try {
        setLoading(true);
        const userRef = doc(db, 'users', user.uid);

        // Check current credits
        const currentCredits = userProfile.credits || {
          free_remaining: FREE_CREDITS,
          premium_remaining: 0,
          total_used: 0
        };

        // Premium users have unlimited credits
        if (userProfile.subscription?.tier === 'premium') {
          await updateDoc(userRef, {
            'credits.total_used': increment(1)
          });
          await refreshProfile();
          return { success: true, remaining: Infinity };
        }

        // Check if credits available
        if (currentCredits.free_remaining <= 0 && currentCredits.premium_remaining <= 0) {
          return { success: false, error: 'No credits remaining', remaining: 0 };
        }

        // Deduct from premium first, then free
        if (currentCredits.premium_remaining > 0) {
          await updateDoc(userRef, {
            'credits.premium_remaining': increment(-1),
            'credits.total_used': increment(1)
          });
        } else {
          await updateDoc(userRef, {
            'credits.free_remaining': increment(-1),
            'credits.total_used': increment(1)
          });
        }

        await refreshProfile();
        const newCredits = getCredits();
        return {
          success: true,
          remaining: newCredits.freeRemaining + newCredits.premiumRemaining
        };
      } catch (error) {
        console.error('Error using credit:', error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    } else {
      // Anonymous user - use localStorage
      if (isApiKey) {
        if (apiKeyCredits <= 0) {
          return { success: false, error: 'API key credits exhausted', remaining: 0 };
        }
        const newCredits = apiKeyCredits - 1;
        setApiKeyCredits(newCredits);
        localStorage.setItem('outreach_apikey_credits', String(newCredits));
        return { success: true, remaining: newCredits };
      } else {
        if (localCredits <= 0) {
          return { success: false, error: 'Free credits exhausted', remaining: 0 };
        }
        const newCredits = localCredits - 1;
        setLocalCredits(newCredits);
        localStorage.setItem('outreach_free_credits', String(newCredits));
        return { success: true, remaining: newCredits };
      }
    }
  }, [user, userProfile, localCredits, apiKeyCredits, refreshProfile, getCredits]);

  // Add credits (for purchases or admin)
  const addCredits = useCallback(async (amount, type = 'premium') => {
    if (!user) {
      return { success: false, error: 'Must be authenticated to add credits' };
    }

    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      const field = type === 'free' ? 'credits.free_remaining' : 'credits.premium_remaining';

      await updateDoc(userRef, {
        [field]: increment(amount)
      });

      await refreshProfile();
      return { success: true };
    } catch (error) {
      console.error('Error adding credits:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, refreshProfile]);

  // Check if user has credits
  const hasCredits = useCallback((apiKey = null) => {
    if (user && userProfile) {
      // Premium users always have credits
      if (userProfile.subscription?.tier === 'premium') return true;
      const credits = userProfile.credits || {};
      return (credits.free_remaining || 0) > 0 || (credits.premium_remaining || 0) > 0;
    }

    // Anonymous users
    if (apiKey) {
      return apiKeyCredits > 0;
    }
    return localCredits > 0;
  }, [user, userProfile, localCredits, apiKeyCredits]);

  // Reset local credits (for testing)
  const resetLocalCredits = useCallback(() => {
    setLocalCredits(FREE_CREDITS);
    setApiKeyCredits(API_KEY_CREDITS);
    localStorage.setItem('outreach_free_credits', String(FREE_CREDITS));
    localStorage.setItem('outreach_apikey_credits', String(API_KEY_CREDITS));
  }, []);

  // Sync local state when user logs in
  useEffect(() => {
    if (user && userProfile) {
      // User is authenticated - could migrate localStorage credits to Firestore
      const savedFree = localStorage.getItem('outreach_free_credits');
      if (savedFree && parseInt(savedFree, 10) < FREE_CREDITS) {
        // User has used some anonymous credits - could potentially migrate this data
        console.log('User has anonymous credit history, could migrate:', savedFree);
      }
    }
  }, [user, userProfile]);

  return {
    // State
    ...getCredits(),
    loading,

    // Computed
    hasCredits,
    creditsRemaining: getCredits().freeRemaining + getCredits().premiumRemaining,

    // Anonymous-specific (for backwards compatibility)
    localCredits,
    apiKeyCredits,

    // Methods
    useCredit,
    addCredits,
    resetLocalCredits,

    // Constants
    FREE_CREDITS,
    API_KEY_CREDITS
  };
}

export default useCredits;
