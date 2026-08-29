// Service worker: offline-first voor app-bestanden, netwerk voor API's
const CACHE = 'fait-v25';
const ASSETS = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/app.js', 'js/state.js', 'js/icu.js', 'js/engine.js',
  'js/data/exercises.js', 'js/data/program.js',
  'js/ui/common.js', 'js/ui/today.js', 'js/ui/workout.js', 'js/ui/week.js',
  'js/ui/library.js', 'js/ui/progress.js', 'js/ui/settings.js', 'js/ui/editor.js', 'js/ui/cast.js',
  'js/tvsync.js', 'js/vendor/mqtt.min.js', 'js/tv.bundle.js', 'tv.html', 'cast.html',
  'assets/clips/biceps_hammer_curl.mp4', 'assets/clips/chest_svend_press.mp4',
  'assets/clips/full_kettlebell_swing.mp4', 'assets/clips/glutes_step_up.mp4',
  'assets/clips/hams_stiff_leg_deadlift.mp4', 'assets/clips/quads_bulgarian_split_squat.mp4',
  'assets/clips/quads_goblet_squat.mp4', 'assets/clips/shoulders_arnold_press.mp4',
  'assets/clips/shoulders_dumbbell_press.mp4', 'assets/clips/shoulders_front_raise.mp4',
  'assets/clips/shoulders_lateral_raise.mp4',
  'assets/fonts/bbh-hegarty-400.woff2',
  'assets/icons/icon-180.png', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Code (HTML/JS/CSS) → netwerk eerst, zodat een nieuwe versie meteen zichtbaar is.
// Media (fonts, iconen, demo's, clips) → cache eerst, want die moeten snel zijn
// en veranderen zelden. In beide gevallen is de cache het offline-vangnet.
const CODE_RE = /\.(?:html|js|css|webmanifest)$/;

function withTimeout(p, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(r => { clearTimeout(t); resolve(r); }, e => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // API's en YouTube altijd via netwerk
  if (e.request.method !== 'GET') return;

  const isCode = e.request.mode === 'navigate' || CODE_RE.test(url.pathname);

  if (isCode) {
    e.respondWith((async () => {
      try {
        const res = await withTimeout(fetch(e.request), 4000);
        if (res && res.ok) (await caches.open(CACHE)).put(e.request, res.clone());
        return res;
      } catch {
        return (await caches.match(e.request))
          || (await caches.match('index.html'))
          || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    try {
      const res = await fetch(e.request);
      if (res.ok) (await caches.open(CACHE)).put(e.request, res.clone());
      return res;
    } catch {
      return new Response('', { status: 504 });
    }
  })());
});

// De app kan vragen om direct over te schakelen op een nieuwe versie.
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
