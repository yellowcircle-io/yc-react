import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { replayIntegration } from '@sentry/replay'
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

    // Session Replay configuration
    integrations: [
      replayIntegration({
        // Mask all text for privacy (can be relaxed later)
        maskAllText: false,
        // Block all media (images/videos) - reduces bandwidth
        blockAllMedia: false,
        // Only record sessions that have errors
        // On free plan, this is most efficient use of quota
      }),
    ],

    // Capture 0% of sessions normally, 100% when error occurs
    // This is optimal for free tier - only records when needed
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

// Register service worker for PWA/offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[App] Service worker registered:', registration.scope);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available - could show update notification here
                console.log('[App] New service worker available');
              }
            });
          }
        });
      })
      .catch((err) => {
        console.error('[App] Service worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterApp />
    </ErrorBoundary>
  </StrictMode>,
)
