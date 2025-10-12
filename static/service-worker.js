// Minimal service worker for PWA installation support
// Version: 1.0.1 - Update this version to force service worker update
const VERSION = '1.0.1';

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  console.log('Service Worker version', VERSION, 'installing');
  self.skipWaiting();
});

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker version', VERSION, 'activating');
  event.waitUntil(
    // Clear any existing caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => {
      // Force all tabs to reload with new service worker
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'RELOAD' });
        });
      });
    })
  );
  return self.clients.claim();
});

// Fetch event - always use network with no-cache headers
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Clone the request and add no-cache headers
  const modifiedRequest = new Request(event.request, {
    cache: 'no-store',
    headers: new Headers({
      ...Object.fromEntries(event.request.headers.entries()),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    })
  });
  
  event.respondWith(
    fetch(modifiedRequest)
      .then((response) => {
        // Clone the response and add no-cache headers
        const modifiedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers({
            ...Object.fromEntries(response.headers.entries()),
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          })
        });
        return modifiedResponse;
      })
      .catch((error) => {
        console.error('Fetch failed:', error);
        throw error;
      })
  );
});

