import { useState, useCallback, useRef } from 'react';

/**
 * useAsyncAction - Prevents duplicate async operations
 *
 * Solves the "double-click" problem where users can trigger
 * multiple API calls by clicking rapidly.
 *
 * Features:
 * - Prevents concurrent execution of the same action
 * - Tracks loading state
 * - Captures and exposes errors
 * - Optional debounce delay
 *
 * Usage:
 * ```javascript
 * const { execute, isLoading, error } = useAsyncAction(async (data) => {
 *   await api.submitForm(data);
 * });
 *
 * <button onClick={() => execute(formData)} disabled={isLoading}>
 *   {isLoading ? 'Submitting...' : 'Submit'}
 * </button>
 * ```
 */
export function useAsyncAction(asyncFn, options = {}) {
  const { debounceMs = 0 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const lastCallTime = useRef(0);
  const pendingRef = useRef(false);

  const execute = useCallback(async (...args) => {
    // Prevent concurrent execution
    if (pendingRef.current) {
      return { skipped: true, reason: 'already_pending' };
    }

    // Debounce check
    const now = Date.now();
    if (debounceMs > 0 && now - lastCallTime.current < debounceMs) {
      return { skipped: true, reason: 'debounced' };
    }

    pendingRef.current = true;
    lastCallTime.current = now;
    setIsLoading(true);
    setError(null);

    try {
      const res = await asyncFn(...args);
      setResult(res);
      return { success: true, data: res };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
      pendingRef.current = false;
    }
  }, [asyncFn, debounceMs]);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    setIsLoading(false);
    pendingRef.current = false;
  }, []);

  return {
    execute,
    isLoading,
    error,
    result,
    reset,
    // Convenience: can be spread onto button props
    buttonProps: {
      disabled: isLoading,
      'aria-busy': isLoading,
    }
  };
}

/**
 * useAsyncSubmit - Specialized version for form submissions
 *
 * Same as useAsyncAction but with form-specific defaults:
 * - 300ms debounce to prevent double-submit
 * - Clears error on new submission
 */
export function useAsyncSubmit(asyncFn) {
  return useAsyncAction(asyncFn, { debounceMs: 300 });
}

export default useAsyncAction;
