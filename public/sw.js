// Service Worker Version - Update this timestamp when deploying new versions
const APP_VERSION = '__BUILD_TIME__'; // This will be replaced at build time
const CACHE_NAME = `college-central-${APP_VERSION}`;
const STATIC_CACHE = `static-${APP_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${APP_VERSION}`;

const urlsToCache = [
  '/',
  '/logo.svg'
  // App shell and critical pages will be cached dynamically
];

self.addEventListener('install', event => {
  // Skip waiting to activate immediately - REMOVED to allow user control
  // self.skipWaiting();

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete any cache that doesn't match current version
          if (cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );

  // Notify clients about the update
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION });
    });
  });
});

// Listen for skip waiting message from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  // Don't cache Firebase backend requests - let Firebase SDKs handle these
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('firebaselogging-pa.googleapis.com') ||
      event.request.url.includes('firebase.googleapis.com')) {
    event.respondWith(fetch(event.request).catch(() => {
      // Silently fail for Firebase logging/analytics errors
      return new Response('', { status: 200 });
    }));
    return;
  }

  // Network-first strategy for weather and AI API requests
  // Always try to fetch fresh data, fall back to cache if network fails
  // Only cache GET requests (POST requests cannot be cached)
  if (event.request.url.includes('open-meteo.com') || event.request.url.includes('generativelanguage.googleapis.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Only cache GET requests
          if (event.request.method === 'GET') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try to return cached version (only works for GET requests)
          if (event.request.method === 'GET') {
            return caches.match(event.request).then(cachedResponse => {
              return cachedResponse || new Response('{"error": "Offline"}', {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            });
          }
          // For non-GET requests, return error response
          return new Response('{"error": "Offline"}', {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Don't cache external images that might fail
  if (event.request.url.includes('iitism.ac.in') || event.request.url.includes('via.placeholder.com')) {
    event.respondWith(fetch(event.request).catch(() => {
      // Return a simple response for failed external requests
      return new Response('', { status: 404 });
    }));
    return;
  }

  // Network-first strategy for HTML, JS, and CSS to ensure fresh updates
  const isAppAsset = event.request.url.includes('.html') ||
                     event.request.url.includes('.js') ||
                     event.request.url.includes('.css') ||
                     event.request.url.endsWith('/') ||
                     event.request.url.includes('/assets/');

  // Check if this is a navigation request
  const isNavigationRequest = event.request.mode === 'navigate';

  if (isAppAsset) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh response
          if (response && response.status === 200 && event.request.method === 'GET') {
            // Only cache http and https requests, skip chrome-extension and others
            if (event.request.url.startsWith('http')) {
              const responseToCache = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
          }
          return response;
        })
        .catch(() => {
          // Network failed, fallback to cache
          return caches.match(event.request).then(cachedResponse => {
            // If we have a cached version, return it
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // For navigation requests, redirect to offline page
            if (isNavigationRequest) {
              return caches.match('/').then(rootResponse => {
                if (rootResponse) {
                  // Clone the response and modify to show offline route
                  return rootResponse;
                }
                return new Response('Offline', {
                  status: 503,
                  statusText: 'Service Unavailable'
                });
              });
            }
            
            // For other requests, return error
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        })
    );
    return;
  }

  // Cache-first strategy for static assets (images, fonts, etc.)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || event.request.method !== 'GET') {
            return response;
          }

          if (event.request.url.startsWith('http')) {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        }).catch(() => {
          return new Response('', { status: 404 });
        });
      })
  );
});
