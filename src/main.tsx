import { setupGlobalErrorTracking } from '@lib/utils/errorTracking';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

// Setup global error tracking
if (import.meta.env.PROD) {
  setupGlobalErrorTracking();
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check for updates every 60 minutes
        setInterval(
          () => {
            registration.update();
          },
          60 * 1000 * 1000
        );

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is installed and ready
                // Tell it to skip waiting and activate immediately
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((err) => {
        // Ignore security errors in development
        if (err.name !== 'SecurityError') {
          console.error('ServiceWorker registration failed: ', err);
        }
      });

    // Listen for controller change (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // New service worker has taken control, reload the page
      window.location.reload();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        // Page will reload automatically via controllerchange event
      }
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
