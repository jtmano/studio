
const CACHE_NAME = 'fitness-focus-cache-v1';
const OFFLINE_URL = 'offline.html';
const API_ROUTES = [
  '/api/load-template', // Assuming templates are fetched via an API route
  '/api/get-history'   // Assuming history is fetched via an API route
  // In reality, these are Supabase URLs, so we'll need to match them.
  // Supabase URLs are complex, so we'll match by path pattern.
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching app shell');
      return cache.addAll([
        '/',
        '/offline.html',
        // Add other core assets you want to pre-cache
        // e.g., '/styles/main.css', '/scripts/main.js'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stale-while-revalidate strategy for Supabase API calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Check if the request is for Supabase data (for templates or history)
  // This is a generic pattern. You might need to make it more specific.
  const isApiRequest = url.hostname.endsWith('supabase.co') && url.pathname.includes('/rest/v1/');

  if (isApiRequest) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            // If the fetch is successful, clone it and put it in the cache
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });

          // Return cached response if available, otherwise wait for the network
          return cachedResponse || fetchPromise;
        });
      })
    );
  } else if (event.request.mode === 'navigate') {
    // Handle navigation requests (page loads)
    event.respondWith(
      fetch(event.request).catch(() => {
        // If the network fails, serve the offline page
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
  } else {
    // For other requests (CSS, JS, images), use a cache-first strategy
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
