/**
 * Admin Configuration
 *
 * Centralizes admin API configuration with Firebase Auth SSO.
 * Uses Firebase ID tokens for authentication (preferred).
 * Falls back to legacy tokens for backwards compatibility.
 */

import { getAuth } from 'firebase/auth';

// Firebase Functions base URL
export const FUNCTIONS_BASE_URL = 'https://us-central1-yellowcircle-app.cloudfunctions.net';

// Legacy tokens (backwards compatibility - prefer Firebase Auth)
export const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || '';
export const CLEANUP_TOKEN = import.meta.env.VITE_CLEANUP_TOKEN || '';

/**
 * Get the current user's Firebase ID token
 * @returns {Promise<string|null>} ID token or null if not authenticated
 */
export const getIdToken = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.warn('No authenticated user for admin request');
      return null;
    }
    // Force refresh to ensure token is valid
    const token = await user.getIdToken(true);
    return token;
  } catch (error) {
    console.error('Failed to get ID token:', error);
    return null;
  }
};

/**
 * Get headers for admin API calls (async - uses Firebase Auth)
 * @param {Object} options - { useLegacyToken: boolean, tokenType: 'admin' | 'cleanup' }
 * @returns {Promise<Object>} Headers object
 */
export const getAdminHeaders = async (options = {}) => {
  const { useLegacyToken = false, tokenType = 'admin' } = options;

  const headers = {
    'Content-Type': 'application/json'
  };

  // Prefer Firebase Auth (SSO)
  if (!useLegacyToken) {
    const idToken = await getIdToken();
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
      return headers;
    }
    console.warn('No ID token available, falling back to legacy token');
  }

  // Fallback to legacy token
  const legacyToken = tokenType === 'cleanup' ? CLEANUP_TOKEN : ADMIN_TOKEN;
  if (legacyToken) {
    headers['x-admin-token'] = legacyToken;
  } else {
    console.warn(`No ${tokenType} token configured. Admin request may fail.`);
  }

  return headers;
};

/**
 * Synchronous version for legacy code (uses x-admin-token)
 * @deprecated Use getAdminHeaders() instead
 */
export const getAdminHeadersSync = (tokenType = 'admin') => {
  const token = tokenType === 'cleanup' ? CLEANUP_TOKEN : ADMIN_TOKEN;
  return {
    'Content-Type': 'application/json',
    'x-admin-token': token || ''
  };
};

/**
 * Check if user is authenticated (can make admin requests)
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const auth = getAuth();
  return Boolean(auth.currentUser);
};

/**
 * Check if legacy admin tokens are configured
 * @returns {boolean}
 */
export const isLegacyConfigured = () => {
  return Boolean(ADMIN_TOKEN);
};
