// SleeperBid Service Worker
const CACHE = 'sleeperbid-v3';

const STATIC = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/app.js',
  './js/sleeper.js',
  './js/ui.js',
  './js/auction.js',
  './js/cap.js',
  './js/draft.js',
  './js/standings.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  if (
    url.includes('firebaseio.com') ||
    url.includes('firebase.google') ||
    url.includes('sleeper.app') ||
    url.includes('sleepercdn.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com') ||
    url.includes('tenor.com') ||
    url.includes('googletagmanager.com')
  ) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }

  if (url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
