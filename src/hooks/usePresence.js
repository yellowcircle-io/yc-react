import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * usePresence Hook
 *
 * Real-time presence tracking for collaborative editing
 * Shows which users are currently viewing/editing a capsule
 *
 * Features:
 * - Real-time user presence updates via Firestore onSnapshot
 * - Automatic heartbeat to maintain active status (10s interval)
 * - Idle detection after 5 minutes of inactivity
 * - Automatic cleanup on disconnect/tab close
 * - Handles visibility changes (tab switching)
 *
 * @param {string} capsuleId - The capsule ID to track presence for
 * @param {object} user - Current user object with uid, displayName, photoURL, email
 * @returns {object} { activeUsers, isActive, error }
 */
export const usePresence = (capsuleId, user) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);

  const heartbeatIntervalRef = useRef(null);
  const idleTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const presenceDocRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Constants
  const HEARTBEAT_INTERVAL = 10000; // 10 seconds
  const IDLE_TIMEOUT = 300000; // 5 minutes
  const PRESENCE_TIMEOUT = 30000; // 30 seconds - consider user offline after this

  /**
   * Update presence document in Firestore
   */
  const updatePresence = useCallback(async (status = 'active') => {
    if (!capsuleId || !user?.uid) return;

    try {
      const presenceRef = doc(db, 'capsules', capsuleId, 'presence', user.uid);
      presenceDocRef.current = presenceRef;

      const presenceData = {
        userId: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        email: user.email || '',
        photoURL: user.photoURL || '',
        status,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(presenceRef, presenceData, { merge: true });
      setIsActive(status === 'active');
      setError(null);
    } catch (err) {
      console.error('Error updating presence:', err);
      setError(err.message);
    }
  }, [capsuleId, user]);

  /**
   * Remove presence document (user left)
   */
  const removePresence = useCallback(async () => {
    if (!presenceDocRef.current) return;

    try {
      await deleteDoc(presenceDocRef.current);
      setIsActive(false);
    } catch (err) {
      console.error('Error removing presence:', err);
    }
  }, []);

  /**
   * Record user activity (reset idle timer)
   */
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();

    // If was idle, update to active
    if (isActive === false && user?.uid) {
      updatePresence('active');
    }

    // Reset idle timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      updatePresence('idle');
    }, IDLE_TIMEOUT);
  }, [isActive, user, updatePresence]);

  /**
   * Set up presence tracking
   */
  useEffect(() => {
    if (!capsuleId || !user?.uid) return;

    // Initial presence
    updatePresence('active');

    // Set up heartbeat
    heartbeatIntervalRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      const status = timeSinceActivity > IDLE_TIMEOUT ? 'idle' : 'active';
      updatePresence(status);
    }, HEARTBEAT_INTERVAL);

    // Set up activity listeners
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    // Initial idle timeout
    recordActivity();

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('idle');
      } else {
        recordActivity();
        updatePresence('active');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload (tab close)
    const handleBeforeUnload = () => {
      removePresence();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, recordActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      removePresence();
    };
  }, [capsuleId, user, updatePresence, removePresence, recordActivity]);

  /**
   * Subscribe to presence updates for all users
   */
  useEffect(() => {
    if (!capsuleId) return;

    try {
      const presenceCollectionRef = collection(db, 'capsules', capsuleId, 'presence');

      // Query for recent presence (last 24 hours to avoid stale data)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const presenceQuery = query(
        presenceCollectionRef,
        where('lastSeen', '>', Timestamp.fromDate(oneDayAgo))
      );

      const unsubscribe = onSnapshot(
        presenceQuery,
        (snapshot) => {
          const now = Date.now();
          const users = [];

          snapshot.forEach((doc) => {
            const data = doc.data();

            // Check if user is still active (within timeout window)
            const lastSeenMs = data.lastSeen?.toMillis() || 0;
            const isRecentlyActive = (now - lastSeenMs) < PRESENCE_TIMEOUT;

            if (isRecentlyActive) {
              users.push({
                id: doc.id,
                ...data,
                lastSeenMs
              });
            }
          });

          // Sort by most recently active
          users.sort((a, b) => b.lastSeenMs - a.lastSeenMs);

          setActiveUsers(users);
          setError(null);
        },
        (err) => {
          console.error('Error listening to presence:', err);
          setError(err.message);
        }
      );

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      console.error('Error setting up presence listener:', err);
      setError(err.message);
    }
  }, [capsuleId]);

  return {
    activeUsers,
    isActive,
    error
  };
};

export default usePresence;
