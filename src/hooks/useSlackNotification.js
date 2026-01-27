/**
 * useSlackNotification Hook
 *
 * React hook wrapper around slackNotify utility.
 * Provides loading/error states and debouncing for rapid notifications.
 *
 * Phase 1 of Apple Shortcuts + Slack integration.
 * See: dev-context/SCOPE_APPLE_SHORTCUTS_SLACK.md
 *
 * @created 2026-01-24
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import {
  sendSlackMessage,
  sendSlackBlocks,
  notifyLinkArchived,
  notifySystemStatus,
  notifyContentShared,
  isSlackConfigured,
  getWebhookStatus,
} from '../utils/slackNotify';

// Default debounce time in ms
const DEFAULT_DEBOUNCE_MS = 1000;

/**
 * Hook for sending Slack notifications with state management
 *
 * @param {Object} options - Hook options
 * @param {number} options.debounceMs - Debounce time in ms (default: 1000)
 * @returns {Object} Notification functions and state
 *
 * @example
 * const { notify, notifyBlocks, isLoading, error, isConfigured } = useSlackNotification();
 *
 * // Simple message
 * await notify('Hello from yellowCircle!');
 *
 * // With debouncing (prevents spam)
 * await notify('User clicked button');
 */
export function useSlackNotification(options = {}) {
  const { debounceMs = DEFAULT_DEBOUNCE_MS } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  // Debounce tracking
  const lastCallTime = useRef(0);
  const pendingCall = useRef(null);

  /**
   * Check if we should debounce this call
   * @returns {boolean}
   */
  const shouldDebounce = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime.current;
    return timeSinceLastCall < debounceMs;
  }, [debounceMs]);

  /**
   * Execute a notification function with state management and debouncing
   * @param {Function} notifyFn - The notification function to execute
   * @param {Array} args - Arguments to pass to the function
   * @param {boolean} skipDebounce - Skip debounce check
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const executeWithState = useCallback(
    async (notifyFn, args, skipDebounce = false) => {
      // Check debounce
      if (!skipDebounce && shouldDebounce()) {
        console.debug('[useSlackNotification] Debounced - too many rapid calls');
        return { success: false, error: 'Debounced - please wait' };
      }

      // Clear any pending call
      if (pendingCall.current) {
        clearTimeout(pendingCall.current);
        pendingCall.current = null;
      }

      setIsLoading(true);
      setError(null);
      lastCallTime.current = Date.now();

      try {
        const result = await notifyFn(...args);
        setLastResult(result);

        if (!result.success) {
          setError(result.error || 'Unknown error');
        }

        return result;
      } catch (err) {
        const errorMessage = err.message || 'Unexpected error';
        setError(errorMessage);
        setLastResult({ success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [shouldDebounce]
  );

  /**
   * Send a simple text message
   * @param {string} text - Message text
   * @param {Object} msgOptions - Slack message options
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const notify = useCallback(
    (text, msgOptions = {}) => {
      return executeWithState(sendSlackMessage, [text, msgOptions]);
    },
    [executeWithState]
  );

  /**
   * Send a Block Kit message
   * @param {Array} blocks - Block Kit blocks array
   * @param {Object} msgOptions - Slack message options
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const notifyBlocks = useCallback(
    (blocks, msgOptions = {}) => {
      return executeWithState(sendSlackBlocks, [blocks, msgOptions]);
    },
    [executeWithState]
  );

  /**
   * Send link archived notification
   * @param {Object} link - Link data
   * @param {Object} msgOptions - Slack message options
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const notifyLink = useCallback(
    (link, msgOptions = {}) => {
      return executeWithState(notifyLinkArchived, [link, msgOptions]);
    },
    [executeWithState]
  );

  /**
   * Send system status notification
   * @param {string} status - Status type
   * @param {string} message - Status message
   * @param {Object} msgOptions - Slack message options
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const notifyStatus = useCallback(
    (status, message, msgOptions = {}) => {
      return executeWithState(notifySystemStatus, [status, message, msgOptions]);
    },
    [executeWithState]
  );

  /**
   * Send content shared notification
   * @param {Object} share - Share data
   * @param {Object} msgOptions - Slack message options
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const notifyShare = useCallback(
    (share, msgOptions = {}) => {
      return executeWithState(notifyContentShared, [share, msgOptions]);
    },
    [executeWithState]
  );

  /**
   * Force send (skip debounce) - use sparingly
   * @param {string} text - Message text
   * @param {Object} msgOptions - Slack message options
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const forceNotify = useCallback(
    (text, msgOptions = {}) => {
      return executeWithState(sendSlackMessage, [text, msgOptions], true);
    },
    [executeWithState]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Configuration status
   */
  const configStatus = useMemo(
    () => ({
      isConfigured: isSlackConfigured(),
      webhookStatus: getWebhookStatus(),
    }),
    []
  );

  return {
    // State
    isLoading,
    error,
    lastResult,
    isConfigured: configStatus.isConfigured,
    webhookStatus: configStatus.webhookStatus,

    // Actions
    notify,
    notifyBlocks,
    notifyLink,
    notifyStatus,
    notifyShare,
    forceNotify,
    clearError,
  };
}

export default useSlackNotification;
