const CACHE = 'ethos-ob-v2-7';
const ASSETS = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-180.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()).catch(()=>{}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;
  if (isHTML) {
    // network-first: la app se actualiza sola cuando hay internet; cae al cache si está offline
    e.respondWith(
      fetch(req).then(resp => {
        if (resp && resp.ok) { const cp = resp.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); }
        return resp;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
  } else {
    // cache-first para estáticos (íconos, manifest)
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(resp => {
        if (resp && resp.ok && req.url.indexOf(self.location.origin) === 0) { const cp = resp.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
        return resp;
      }).catch(() => caches.match('./index.html')))
    );
  }
});
