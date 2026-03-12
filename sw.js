// SleeperBid Service Worker
// Caches the app shell for offline launch; data always fetches live.

const CACHE = 'sleeperbid-v1';

// Files to cache on install — the app shell
const SHELL = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/firebase-config.js',
  '/js/sleeper.js',
  '/js/auction.js',
  '/js/ui.js',
  '/js/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: cache the shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API/Firebase calls, cache-first for shell assets
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always go live for Firebase, Sleeper API, fonts
  if (
    url.includes('firebaseio.com') ||
    url.includes('firebase') ||
    url.includes('sleeper.app') ||
    url.includes('sleepercdn.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Shell assets: cache-first, fall back to network
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      // Cache fresh copies of shell files
      if (res.ok && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
