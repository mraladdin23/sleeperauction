// SleeperBid Service Worker
// !! Bump this version string every time you deploy changes !!
// Format: 'sleeperbid-YYYY-MM-DD-N' (N = deploy count that day)
const CACHE = 'sleeperbid-2026-01-01-1';

const STATIC = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: only cache icons (not JS/CSS — those always fetch fresh)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate: clear ALL old caches, take control immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
//  - JS, CSS, HTML  → network-first (always get latest, fall back to cache if offline)
//  - Firebase/API   → network only (never cache live data)
//  - Icons          → cache-first (never change)
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Live data — never cache
  if (
    url.includes('firebaseio.com') ||
    url.includes('firebase.google') ||
    url.includes('sleeper.app') ||
    url.includes('sleepercdn.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // App code — network-first so deploys are always picked up
  if (url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.html') || url.endsWith('/')) {
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

  // Icons etc. — cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
