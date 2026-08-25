/* WorkWell 360 — service worker (offline-first app shell) */
const CACHE = 'ww360-v5';
const ASSETS = [
  './', './index.html', './css/app.css', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/logo-full.png',
  './js/app.js', './js/store.js', './js/ui.js', './js/data.js',
  './js/views/core.js', './js/views/anger.js', './js/views/stress.js',
  './js/views/burnout.js', './js/views/counselling.js', './js/views/retirement.js',
  './js/views/family.js', './js/views/store.js', './js/views/employer.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  // network-first for navigation, cache-first for assets
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
