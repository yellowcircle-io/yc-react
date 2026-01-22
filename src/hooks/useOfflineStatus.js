/**
 * Hook for managing offline status and offline link operations
 *
 * @created 2026-01-22
 */

import { useState, useEffect, useCallback } from 'react';
import {
  saveOffline,
  removeOffline,
  isOffline as _isOffline, // Reserved for future per-link offline checks
  getOfflineLinkIds,
  getOfflineLinks,
  getStorageStats,
  isIndexedDBAvailable,
} from '../utils/offlineStorage';

/**
 * Hook to track online/offline status
 * @returns {{ isOnline: boolean }}
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}

/**
 * Hook to manage offline links
 * @returns {Object} Offline link management functions and state
 */
export function useOfflineLinks() {
  const [offlineLinkIds, setOfflineLinkIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0, estimatedSize: '0 B' });
  const { isOnline } = useNetworkStatus();

  // Load offline link IDs on mount
  useEffect(() => {
    if (!isIndexedDBAvailable()) {
      setLoading(false);
      return;
    }

    const loadOfflineIds = async () => {
      try {
        const ids = await getOfflineLinkIds();
        setOfflineLinkIds(ids);
        const storageStats = await getStorageStats();
        setStats(storageStats);
      } catch (err) {
        console.error('[useOfflineLinks] Failed to load offline IDs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOfflineIds();
  }, []);

  // Check if a link is saved offline
  const isLinkOffline = useCallback(
    (linkId) => offlineLinkIds.has(linkId),
    [offlineLinkIds]
  );

  // Save a link for offline reading
  const saveLinkOffline = useCallback(async (link) => {
    if (!isIndexedDBAvailable()) {
      console.warn('[useOfflineLinks] IndexedDB not available');
      return false;
    }

    try {
      await saveOffline(link);
      setOfflineLinkIds((prev) => new Set([...prev, link.id]));
      const storageStats = await getStorageStats();
      setStats(storageStats);
      return true;
    } catch (err) {
      console.error('[useOfflineLinks] Failed to save offline:', err);
      return false;
    }
  }, []);

  // Remove a link from offline storage
  const removeLinkOffline = useCallback(async (linkId) => {
    if (!isIndexedDBAvailable()) {
      return false;
    }

    try {
      await removeOffline(linkId);
      setOfflineLinkIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(linkId);
        return newSet;
      });
      const storageStats = await getStorageStats();
      setStats(storageStats);
      return true;
    } catch (err) {
      console.error('[useOfflineLinks] Failed to remove offline:', err);
      return false;
    }
  }, []);

  // Toggle offline status for a link
  const toggleLinkOffline = useCallback(
    async (link) => {
      const linkId = typeof link === 'string' ? link : link.id;
      const isCurrentlyOffline = offlineLinkIds.has(linkId);

      if (isCurrentlyOffline) {
        return removeLinkOffline(linkId);
      } else {
        // Need full link object to save
        if (typeof link === 'string') {
          console.error('[useOfflineLinks] Need full link object to save offline');
          return false;
        }
        return saveLinkOffline(link);
      }
    },
    [offlineLinkIds, saveLinkOffline, removeLinkOffline]
  );

  // Get all offline links
  const getAllOfflineLinks = useCallback(async () => {
    if (!isIndexedDBAvailable()) return [];
    try {
      return await getOfflineLinks();
    } catch (err) {
      console.error('[useOfflineLinks] Failed to get offline links:', err);
      return [];
    }
  }, []);

  return {
    isOnline,
    isIndexedDBAvailable: isIndexedDBAvailable(),
    offlineLinkIds,
    offlineCount: offlineLinkIds.size,
    stats,
    loading,
    isLinkOffline,
    saveLinkOffline,
    removeLinkOffline,
    toggleLinkOffline,
    getAllOfflineLinks,
  };
}

export default useOfflineLinks;
