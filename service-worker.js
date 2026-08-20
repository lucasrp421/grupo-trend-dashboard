const CACHE_NAME = 'grupotrend-v9';
const ASSETS = [
  './login.html',
  './index.html',
  './followup.html',
  './app.js',
  './style.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instala e faz cache dos assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Remove caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: network-first para API, stale-while-revalidate para assets
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // API: sempre busca dados frescos
  if (url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets: retorna cache imediato + atualiza em background
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const network = fetch(event.request).then((response) => {
          if (response.ok && event.request.method === 'GET') {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      });
    }).catch(() => caches.match('./login.html'))
  );
});

// Mensagem do app para forçar atualização
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CHECK_UPDATE') {
    self.registration.update().then(() => {
      event.source.postMessage('UPDATE_CHECKED');
    });
  }
});
