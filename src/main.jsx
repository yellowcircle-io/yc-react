import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import RouterApp from './RouterApp.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Initialize Sentry for error monitoring
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE || 'production',

    // Performance monitoring - sample 10% of transactions
    tracesSampleRate: 0.1,

    // Filter out common non-actionable errors
    ignoreErrors: [
      // Browser extensions
      /^chrome-extension/,
      /^moz-extension/,
      // Network errors (user's connection)
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // User cancellation
      'AbortError',
      'cancelled',
    ],

    // Add context for debugging
    beforeSend(event) {
      // Add user context if available
      const userEmail = localStorage.getItem('yc_user_email');
      if (userEmail) {
        event.user = { email: userEmail };
      }

      return event;
    },
  });

  // Expose Sentry globally for testing
  window.Sentry = Sentry;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterApp />
    </ErrorBoundary>
  </StrictMode>,
)
