// Minimal service worker for PWA installation support
// No offline caching - app requires internet connection

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Clear any existing caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - always use network, no caching
self.addEventListener('fetch', (event) => {
  // Just pass through to network
  event.respondWith(fetch(event.request));
});

