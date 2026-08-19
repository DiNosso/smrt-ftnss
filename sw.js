// Service worker: offline-first voor app-bestanden, netwerk voor API's
const CACHE = 'fait-v6';
const ASSETS = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/app.js', 'js/state.js', 'js/icu.js', 'js/engine.js',
  'js/data/exercises.js', 'js/data/program.js',
  'js/ui/common.js', 'js/ui/today.js', 'js/ui/workout.js', 'js/ui/week.js',
  'js/ui/library.js', 'js/ui/progress.js', 'js/ui/settings.js', 'js/ui/editor.js',
  'assets/fonts/bbh-hegarty-400.woff2',
  'assets/icons/icon-180.png', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API's en YouTube altijd via netwerk
  if (url.origin !== location.origin) return;
  // app-bestanden: cache-first, met achtergrond-update
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
