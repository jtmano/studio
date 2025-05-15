
// public/sw.js
const CACHE_NAME = 'fitness-focus-cache-v1';
const urlsToCache = [
  '/',
  '/offline.html'
  // Add paths to critical JS/CSS bundles if they are stable and known
  // e.g., '/_next/static/css/main.css', '/_next/static/chunks/main.js'
  // However, Next.js uses hashed filenames, making this hard without build integration.
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting on install');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Caching failed during install', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // console.log('Service Worker: Fetching', event.request.url);

  // Strategy: Network first, then cache, then offline page for navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Optional: Cache successful GET navigation requests
          // if (response.ok && event.request.method === 'GET') {
          //   const responseToCache = response.clone();
          //   caches.open(CACHE_NAME).then(cache => {
          //     cache.put(event.request, responseToCache);
          //   });
          // }
          return response;
        })
        .catch(() => {
          console.log('Service Worker: Network request failed, serving offline page.');
          return caches.match('/offline.html');
        })
    );
  } else if (urlsToCache.includes(event.request.url) || event.request.destination === 'style' || event.request.destination === 'script') {
    // Strategy: Cache first, then network for app shell assets and static resources
     event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            // console.log('Service Worker: Serving from cache', event.request.url);
            return response;
          }
          // console.log('Service Worker: Not in cache, fetching from network', event.request.url);
          return fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.ok && event.request.method === 'GET') {
              // Optional: Cache other assets dynamically if needed
              // const responseToCache = networkResponse.clone();
              // caches.open(CACHE_NAME).then(cache => {
              //   cache.put(event.request, responseToCache);
              // });
            }
            return networkResponse;
          });
        })
        .catch(error => {
            console.error('Service Worker: Fetch failed for non-navigation', error);
            // For non-navigation requests, you might not want to return offline.html
            // but rather let the browser handle the error or return a specific error response.
        })
    );
  }
  // For other requests, just let the browser handle them
});
