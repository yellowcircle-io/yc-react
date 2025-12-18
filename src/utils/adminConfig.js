/**
 * Admin Configuration
 *
 * Centralizes admin API configuration.
 * Token should be set via environment variable, NOT hardcoded.
 *
 * For production, consider using Firebase Auth ID tokens instead.
 */

// Admin token from environment variable
// Set in .env.local (not committed): VITE_ADMIN_TOKEN=your-secure-token
export const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || '';

// Cleanup token (separate for cleanup operations)
export const CLEANUP_TOKEN = import.meta.env.VITE_CLEANUP_TOKEN || '';

// Firebase Functions base URL
export const FUNCTIONS_BASE_URL = 'https://us-central1-yellowcircle-app.cloudfunctions.net';

/**
 * Get headers for admin API calls
 * @param {string} tokenType - 'admin' or 'cleanup'
 * @returns {Object} Headers object
 */
export const getAdminHeaders = (tokenType = 'admin') => {
  const token = tokenType === 'cleanup' ? CLEANUP_TOKEN : ADMIN_TOKEN;

  if (!token) {
    console.warn(`Missing ${tokenType} token. Set VITE_${tokenType.toUpperCase()}_TOKEN in .env.local`);
  }

  return {
    'Content-Type': 'application/json',
    'x-admin-token': token
  };
};

/**
 * Check if admin tokens are configured
 * @returns {boolean}
 */
export const isAdminConfigured = () => {
  return Boolean(ADMIN_TOKEN);
};

/**
 * Check if cleanup token is configured
 * @returns {boolean}
 */
export const isCleanupConfigured = () => {
  return Boolean(CLEANUP_TOKEN);
};
