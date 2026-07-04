// NIR8 Calculators — Service Worker
// Strategy: Cache-first for assets, network-first for HTML (so updates deploy quickly)
const CACHE_NAME = 'nir8-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/vault',
  '/vault.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/assets/fonts/inter-v19-latin-regular.woff2',
  '/assets/fonts/inter-v19-latin-500.woff2',
  '/assets/fonts/inter-v19-latin-600.woff2',
  '/assets/fonts/inter-v19-latin-700.woff2',
];

// Install: precache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML/navigation, cache-first for everything else
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    // Network-first for HTML: get latest version, fall back to cache if offline
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('/')))
    );
  } else {
    // Cache-first for assets (fonts, images, etc.)
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
  }
});
