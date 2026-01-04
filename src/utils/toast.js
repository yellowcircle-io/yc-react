/**
 * Toast utility - Wrapper for react-hot-toast
 * Provides consistent toast notifications across the app
 */

import toast from 'react-hot-toast';

export const showToast = (message, type = 'info') => {
  const options = {
    duration: 3000,
    position: 'bottom-right',
  };

  switch (type) {
    case 'success':
      return toast.success(message, options);
    case 'error':
      return toast.error(message, options);
    case 'warning':
      return toast(message, { ...options, icon: '⚠️' });
    case 'info':
    default:
      return toast(message, options);
  }
};

export default showToast;
