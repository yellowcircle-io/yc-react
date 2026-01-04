/**
 * Toast utility - Stub implementation
 *
 * Provides a minimal toast notification API that logs to console.
 * Replace with react-hot-toast or similar when UI toasts are needed.
 */

let toastId = 0;

export const showToast = (message, type = 'info') => {
  const id = ++toastId;
  const prefix = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }[type] || 'ℹ️';

  // Log to console (stub behavior)
  console.log(`[Toast ${id}] ${prefix} ${message}`);

  return id;
};

// Mock toast object for direct usage patterns
const toast = (message, _options) => showToast(message, 'info');
toast.success = (message, _options) => showToast(message, 'success');
toast.error = (message, _options) => showToast(message, 'error');

export { toast };
export default showToast;
