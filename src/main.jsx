import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import RouterApp from './RouterApp.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Initialize Sentry for production error monitoring
// DSN will be set via environment variable or placeholder for setup
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,

    // Performance monitoring - sample 10% of transactions
    tracesSampleRate: 0.1,

    // Session replay for debugging (only on errors)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

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
      // Don't send events in development
      if (import.meta.env.DEV) return null;

      // Add user context if available
      const userEmail = localStorage.getItem('yc_user_email');
      if (userEmail) {
        event.user = { email: userEmail };
      }

      return event;
    },
  });

  console.log('Sentry initialized for production monitoring');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterApp />
    </ErrorBoundary>
  </StrictMode>,
)
