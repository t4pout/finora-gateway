self.addEventListener('push', function (event) {
  if (!event.data) return;

  const dados = event.data.json();
  const titulo = dados.title || 'Finora Payments';
  const opcoes = {
    body: dados.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: dados.url || '/dashboard' },
    vibrate: [100, 50, 100]
  };

  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});