// SleeperBid Service Worker - network-first, no pre-caching
const CACHE = 'sleeperbid-v4';

// Skip pre-caching (avoids 404 errors on missing files)
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never cache live API data
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
    return; // let browser handle it
  }

  // App code: network-first, cache as fallback
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
});
