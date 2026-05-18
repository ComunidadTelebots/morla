const CACHE = 'morla-tpv-v2';
const SHELL = ['/tpv/index.html', '/tpv/styles.css', '/tpv/app.js', '/tpv/login.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { pathname } = new URL(e.request.url);

  if (pathname === '/api/session' || pathname === '/login' || pathname === '/logout') return;

  if (pathname === '/api/products' && e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          caches.open(CACHE).then(c => c.put(e.request, r.clone()));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
