
const CACHE_NAME = 'vibe-v3.1';
const ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'New Vibe!', body: 'Check out what is happening nearby!' };
  const options = {
    body: data.body,
    icon: 'https://picsum.photos/id/64/192/192',
    badge: 'https://picsum.photos/id/64/192/192',
    data: data.url
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});
