import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react";
import './index.css'
import App from './App.jsx'

// Initialize Sentry for error tracking and performance monitoring
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // 'development' or 'production'
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true, // Privacy: mask sensitive text
      blockAllMedia: true, // Privacy: block images/videos
    }),
  ],

  // Performance Monitoring
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% when error occurs

  // Filter out development errors
  beforeSend(event, hint) {
    // Don't send errors in development
    if (import.meta.env.MODE === 'development') {
      console.error('Sentry Error (dev):', hint.originalException || hint.syntheticException);
      return null; // Don't send to Sentry
    }
    return event;
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
