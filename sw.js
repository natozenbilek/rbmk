const CACHE_NAME = 'rbmk-site-v3';
const ASSETS = [
  'index.html',
  'rbmk-reactor.html',
  'manifest.json',
  'assets/css/site.css',
  'assets/css/tokens.css',
  'assets/css/fonts.css',
  'assets/css/reset.css',
  'assets/css/nav.css',
  'assets/css/layout.css',
  'assets/css/hero.css',
  'assets/css/sections.css',
  'assets/css/footer.css',
  'assets/css/animations.css',
  'assets/css/responsive.css',
  'assets/js/hero-network-config.js',
  'assets/js/hero-network-math.js',
  'assets/js/hero-network-graph.js',
  'assets/js/hero-network-run.js',
  'assets/js/scroll-reveal.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
