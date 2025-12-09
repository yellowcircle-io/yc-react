/**
 * useAccessRequest - Hook for client access request flow
 *
 * Flow:
 * 1. User fills out request form
 * 2. Request sent to Firebase function
 * 3. Admin receives email with approve/deny links
 * 4. On approval, user is added to whitelist
 * 5. User signs in normally with SSO
 */

import { useState, useCallback } from 'react';

// Firebase function URLs (deployed)
const FUNCTIONS_BASE = 'https://us-central1-yellowcircle-app.cloudfunctions.net';

export function useAccessRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  /**
   * Submit an access request
   * @param {Object} data - Request data
   * @param {string} data.email - User's email (required)
   * @param {string} data.name - User's name (optional)
   * @param {string} data.company - Company name (optional)
   * @param {string} data.reason - Reason for access (optional)
   */
  const requestAccess = useCallback(async (data) => {
    if (!data.email) {
      setError('Email is required');
      return { success: false, error: 'Email is required' };
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    setMessage('');

    try {
      const response = await fetch(`${FUNCTIONS_BASE}/requestAccess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          name: data.name || '',
          company: data.company || '',
          reason: data.reason || '',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request');
      }

      setSuccess(true);
      setMessage(result.message || 'Request submitted successfully');

      return {
        success: true,
        message: result.message,
        alreadyClient: result.alreadyClient,
        alreadyPending: result.alreadyPending,
      };
    } catch (err) {
      console.error('Access request error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Reset the form state
   */
  const reset = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
    setSuccess(false);
    setMessage('');
  }, []);

  return {
    requestAccess,
    reset,
    isSubmitting,
    error,
    success,
    message,
  };
}

export default useAccessRequest;
