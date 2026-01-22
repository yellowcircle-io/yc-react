/**
 * Service Worker for yellowCircle PWA
 * Enables offline reading and caching
 *
 * @created 2026-01-22
 */

const CACHE_NAME = 'yellowcircle-v1';
const STATIC_CACHE = 'yellowcircle-static-v1';
const DYNAMIC_CACHE = 'yellowcircle-dynamic-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.svg',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip Firebase/Firestore API calls - always go to network
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('identitytoolkit')) {
    return;
  }

  // Skip analytics and tracking
  if (url.hostname.includes('google-analytics.com') ||
      url.hostname.includes('googletagmanager.com') ||
      url.hostname.includes('doubleclick.net')) {
    return;
  }

  // For navigation requests (HTML pages) - network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, try cache then fallback to index.html (SPA)
          return caches.match(request)
            .then((cached) => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // For static assets (JS, CSS, images) - cache first, network fallback
  if (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            // Return cached, but also update cache in background
            fetch(request).then((response) => {
              if (response.ok) {
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, response);
                });
              }
            }).catch(() => {});
            return cached;
          }

          // Not in cache, fetch and cache
          return fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // Default: network first for other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_LINK_CONTENT') {
    // Future: Cache link content for offline reading
    const { linkId, content: _content } = event.data;
    console.log('[SW] Caching link content:', linkId);
    // Content will be used when background caching is implemented
  }
});

// Background sync for reading progress (when online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reading-progress') {
    console.log('[SW] Syncing reading progress...');
    // Will be implemented in Phase 4
  }
});

console.log('[SW] Service worker loaded');
