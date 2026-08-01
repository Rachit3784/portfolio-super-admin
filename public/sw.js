// public/sw.js - Service Worker for Background Call Notifications & Web Push in Admin Portal
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: '📹 Incoming Recruiter Call', body: event.data ? event.data.text() : 'A recruiter is calling you' };
  }

  const title = data.title || '📹 Incoming Recruiter Video Call';
  const options = {
    body: data.body || 'A recruiter is calling you on WebRTC Video Call...',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [400, 200, 400, 200, 400],
    tag: 'incoming-admin-call',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || '/' },
    actions: [
      { action: 'answer', title: '📞 Answer Call' },
      { action: 'decline', title: '❌ Decline' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
