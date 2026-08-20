// أذكار — service worker (offline support)
const CACHE = 'azkar-v103';
// core app files that MUST be cached for offline use
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];
// optional extras (fonts) — nice to have, must NOT block core caching
const EXTRA = [
  'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Amiri+Quran&family=Scheherazade+New:wght@400;700&family=Reem+Kufi:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // cache each file individually so ONE failure never blocks the rest
      Promise.allSettled([
        ...CORE.map(u => c.add(u)),
        ...EXTRA.map(u => c.add(u))
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// cache-first: serve from cache, else fetch and store; navigations fall back to index.html
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        return res;
      }).catch(() => {
        // offline fallback: for page navigations, serve the app shell
        if (e.request.mode === 'navigate') return caches.match('./index.html') || caches.match('./');
        return caches.match('./index.html');
      });
    })
  );
});
