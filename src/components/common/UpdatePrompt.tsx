import React, { useEffect } from 'react';

const UpdatePrompt: React.FC = () => {
  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) return;

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      const waitingWorker = registration.waiting;
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }
    };

    // Listen for service worker updates
    navigator.serviceWorker.ready.then((registration) => {
      // Check if there's a waiting service worker
      if (registration.waiting) {
        handleUpdate(registration);
      }

      // Listen for new service worker installing
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is installed and ready
            // Automatically activate it
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    });

    // Listen for messages from service worker
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        // This might be redundant if we handle controllerchange, but good as backup
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('message', messageHandler);

    // Check for updates periodically (every 5 minutes)
    const checkForUpdates = setInterval(
      () => {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update();
        });
      },
      5 * 60 * 1000
    );

    return () => {
      navigator.serviceWorker.removeEventListener('message', messageHandler);
      clearInterval(checkForUpdates);
    };
  }, []);

  // Handle controller change (when new SW takes over)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      // New service worker has taken control, reload to use new version
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // No UI needed for auto-update
  return null;
};

export default UpdatePrompt;
