// c:\dev\pfc-oustada\public\service-worker.js
const CACHE_NAME = 'iot-dashboard-cache-v1';
const urlsToCache = [
  '/dashboard', // Assuming this is the main page URL for dashboard.html
  '/css/styles.css',
  '/js/dashboard.js',
  // Socket.IO is handled by network-only, so not caching its client script here.
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Playfair+Display:wght@700&display=swap',
  '/images/no-image.png', // Fallback camera image
  // Add paths to your PWA icons if you want them cached, e.g., '/images/icons/icon-192x192.png'
];

self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        // For CDN URLs, use Request object with 'no-cors' mode if you face CORS issues during caching.
        // However, it's often better to let the browser handle CDN caching or use specific strategies.
        // Here, we'll attempt to cache them directly. If issues arise, consider 'no-cors' or removing them from explicit caching.
        const cachePromises = urlsToCache.map(urlToCache => {
          const request = new Request(urlToCache, { mode: urlToCache.startsWith('http') ? 'cors' : 'same-origin' });
          return cache.add(request).catch(err => console.warn(`Failed to cache ${urlToCache}: ${err}`));
        });
        return Promise.all(cachePromises);
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache app shell:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Network-only for API calls, camera stream, and Socket.IO
  if (requestUrl.pathname.startsWith('/api/') || 
      requestUrl.pathname.startsWith('/socket.io/') ||
      event.request.url.includes('/api/camera/stream')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Serve from cache
        }
        // Not in cache, fetch from network
        return fetch(event.request).then(networkResponse => {
          // Optionally, cache new static assets if needed, but be careful
          return networkResponse;
        });
      })
  );
});