const CACHE_NAME = 'pwa-taller-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/demos/filesystem.js',
  '/js/demos/authentication.js',
  '/js/demos/facedetection.js',
  '/js/demos/barcode.js',
  '/js/demos/screencapture.js',
  '/js/demos/audio.js',
  '/js/demos/orientation.js',
  '/js/demos/motion.js',
  '/js/demos/multitouch.js',
  '/js/demos/viewtransition.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});