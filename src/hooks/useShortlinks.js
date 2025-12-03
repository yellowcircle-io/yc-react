import { useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  increment,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Generate a random short code
 * @param {number} length - Length of the code (default 6)
 * @returns {string} Random alphanumeric code
 */
const generateShortCode = (length = 6) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Hook for managing shortlinks with tracking
 */
export const useShortlinks = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create a new shortlink
   * @param {Object} params - Shortlink parameters
   * @param {string} params.destinationUrl - Full URL to redirect to
   * @param {string} params.title - Optional title/description
   * @param {string} params.customCode - Optional custom short code
   * @param {string} params.campaign - Optional campaign name for tracking
   * @returns {Promise<Object>} Created shortlink data
   */
  const createShortlink = async ({ destinationUrl, title = '', customCode = '', campaign = '' }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate or use custom short code
      let shortCode = customCode || generateShortCode();

      // Check if custom code already exists
      if (customCode) {
        const existingDoc = await getDoc(doc(db, 'shortlinks', customCode));
        if (existingDoc.exists()) {
          throw new Error('Short code already exists. Please choose a different one.');
        }
      } else {
        // Generate unique code (check for collisions)
        let attempts = 0;
        while (attempts < 10) {
          const existingDoc = await getDoc(doc(db, 'shortlinks', shortCode));
          if (!existingDoc.exists()) break;
          shortCode = generateShortCode();
          attempts++;
        }
      }

      const shortlinkData = {
        shortCode,
        destinationUrl,
        title,
        campaign,
        createdAt: serverTimestamp(),
        isActive: true,
        clicks: 0,
        uniqueClicks: 0
      };

      await setDoc(doc(db, 'shortlinks', shortCode), shortlinkData);

      console.log('✅ Shortlink created:', shortCode);
      return { shortCode, ...shortlinkData };

    } catch (err) {
      console.error('❌ Create shortlink failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get shortlink data and track click
   * @param {string} shortCode - The short code to look up
   * @param {boolean} trackClick - Whether to track this as a click (default true)
   * @returns {Promise<Object|null>} Shortlink data or null if not found
   */
  const getShortlink = async (shortCode, trackClick = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const shortlinkRef = doc(db, 'shortlinks', shortCode);
      const shortlinkSnap = await getDoc(shortlinkRef);

      if (!shortlinkSnap.exists()) {
        return null;
      }

      const data = shortlinkSnap.data();

      // Check if link is active
      if (!data.isActive) {
        return null;
      }

      // Track click if requested
      if (trackClick) {
        // Get click metadata
        const clickData = {
          timestamp: serverTimestamp(),
          referrer: document.referrer || 'direct',
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          language: navigator.language,
          pathname: window.location.pathname
        };

        // Add click to subcollection
        await addDoc(collection(db, `shortlinks/${shortCode}/clicks`), clickData);

        // Increment click counter
        await updateDoc(shortlinkRef, {
          clicks: increment(1)
        });

        // Track unique clicks using sessionStorage
        const uniqueKey = `shortlink_clicked_${shortCode}`;
        if (!sessionStorage.getItem(uniqueKey)) {
          await updateDoc(shortlinkRef, {
            uniqueClicks: increment(1)
          });
          sessionStorage.setItem(uniqueKey, 'true');
        }
      }

      return data;

    } catch (err) {
      console.error('❌ Get shortlink failed:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get all shortlinks (for admin dashboard)
   * @returns {Promise<Array>} Array of shortlink data
   */
  const getAllShortlinks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const shortlinksRef = collection(db, 'shortlinks');
      const q = query(shortlinksRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const shortlinks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null
      }));

      return shortlinks;

    } catch (err) {
      console.error('❌ Get all shortlinks failed:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get click analytics for a shortlink
   * @param {string} shortCode - The short code
   * @param {number} limitCount - Max clicks to fetch (default 100)
   * @returns {Promise<Object>} Click analytics data
   */
  const getClickAnalytics = async (shortCode, limitCount = 100) => {
    setIsLoading(true);
    setError(null);

    try {
      const clicksRef = collection(db, `shortlinks/${shortCode}/clicks`);
      const q = query(clicksRef, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);

      const clicks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || null
      }));

      // Aggregate analytics
      const referrers = {};
      const devices = { mobile: 0, tablet: 0, desktop: 0 };
      const hourlyDistribution = new Array(24).fill(0);

      clicks.forEach(click => {
        // Count referrers
        const ref = click.referrer || 'direct';
        referrers[ref] = (referrers[ref] || 0) + 1;

        // Detect device type from user agent
        const ua = click.userAgent || '';
        if (/mobile/i.test(ua)) {
          devices.mobile++;
        } else if (/tablet/i.test(ua)) {
          devices.tablet++;
        } else {
          devices.desktop++;
        }

        // Hourly distribution
        if (click.timestamp) {
          const hour = click.timestamp.getHours();
          hourlyDistribution[hour]++;
        }
      });

      return {
        totalClicks: clicks.length,
        clicks,
        referrers,
        devices,
        hourlyDistribution
      };

    } catch (err) {
      console.error('❌ Get click analytics failed:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update shortlink
   * @param {string} shortCode - The short code to update
   * @param {Object} updates - Fields to update
   */
  const updateShortlink = async (shortCode, updates) => {
    setIsLoading(true);
    setError(null);

    try {
      const shortlinkRef = doc(db, 'shortlinks', shortCode);
      await updateDoc(shortlinkRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Shortlink updated:', shortCode);
    } catch (err) {
      console.error('❌ Update shortlink failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete shortlink and all click data
   * @param {string} shortCode - The short code to delete
   */
  const deleteShortlink = async (shortCode) => {
    setIsLoading(true);
    setError(null);

    try {
      // Delete all clicks first
      const clicksRef = collection(db, `shortlinks/${shortCode}/clicks`);
      const clicksSnap = await getDocs(clicksRef);

      const deletePromises = clicksSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the shortlink document
      await deleteDoc(doc(db, 'shortlinks', shortCode));

      console.log('✅ Shortlink deleted:', shortCode);
    } catch (err) {
      console.error('❌ Delete shortlink failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle shortlink active status
   * @param {string} shortCode - The short code
   * @param {boolean} isActive - New active status
   */
  const toggleShortlink = async (shortCode, isActive) => {
    return updateShortlink(shortCode, { isActive });
  };

  return {
    createShortlink,
    getShortlink,
    getAllShortlinks,
    getClickAnalytics,
    updateShortlink,
    deleteShortlink,
    toggleShortlink,
    isLoading,
    error
  };
};

export default useShortlinks;
