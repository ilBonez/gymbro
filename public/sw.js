// Service worker minimale: cache-first sugli asset gia' visti, così l'app
// resta utilizzabile offline dopo la prima apertura.
const CACHE = 'gymbro-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest'])));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ??
        fetch(req)
          .then((res) => {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
            return res;
          })
          .catch(() => caches.match('./index.html')),
    ),
  );
});
