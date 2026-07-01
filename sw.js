// Puncak Gateway Service Worker v1.0
// Cache-first untuk asset statis, network-first untuk HTML pages

var CACHE_NAME = 'pg-cache-v1';
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/pages/villa-alana.html',
  '/pages/villa-white-house.html',
  '/pages/villa-mountain-view.html',
  '/pages/villa-keluarga-bahagia.html',
  '/pages/corporate.html',
  '/pages/blog-itinerary-2d1n.html',
  '/pages/blog-tips-pilih-villa.html',
  '/pages/blog-aktivitas-seru-puncak.html',
  '/manifest.json'
];

// Install: pre-cache semua asset statis
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: HTML = network-first (biar selalu fresh), asset lain = cache-first
self.addEventListener('fetch', function(event) {
  var req = event.request;
  var url = req.url;

  // Skip non-GET dan external (Unsplash, fonts, WA)
  if (req.method !== 'GET') return;
  if (url.indexOf('unsplash.com') !== -1) return;
  if (url.indexOf('wa.me') !== -1) return;
  if (url.indexOf('fonts.googleapis.com') !== -1) return;

  // HTML: network-first
  if (req.headers.get('Accept') && req.headers.get('Accept').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(req).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
        return res;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
  }

  // Asset lain: cache-first
  event.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
        return res;
      });
    })
  );
});
