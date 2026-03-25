// SleeperBid Service Worker
// Cache version is stamped by deploy.sh at deploy time — do not edit manually.
const CACHE = 'sleeperbid-1774458403';

const STATIC = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/sleeper.js',
  '/js/auction.js',
  '/js/app.js',
  '/js/ui.js',
  '/js/cap.js',
  '/js/draft.js',
  '/js/standings.js',
  '/js/firebase-config.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: cache icons, skip waiting so new SW activates immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete ALL old caches, claim all clients immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
//   Live data (Firebase, Sleeper API, CDN fonts) → network only, never cache
//   App code (JS, CSS, HTML)                     → network-first, cache as fallback
//   Icons / static assets                        → cache-first
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never cache live data
  if (
    url.includes('firebaseio.com')       ||
    url.includes('firebase.google')      ||
    url.includes('sleeper.app')          ||
    url.includes('sleepercdn.com')       ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // App code — network-first so every deploy is picked up immediately
  if (
    url.endsWith('.js')   ||
    url.endsWith('.css')  ||
    url.endsWith('.html') ||
    url.endsWith('/')
  ) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Icons and other static assets — cache-first
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request))
  );
});
