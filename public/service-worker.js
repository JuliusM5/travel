/* eslint-disable no-restricted-globals */

// Service Worker for TravelMate
const CACHE_NAME = 'travelmate-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Push event - handle push notifications
self.addEventListener('push', event => {
  console.log('Push notification received');
  
  let data = {
    title: 'TravelMate',
    body: 'You have a new notification',
    icon: '/logo192.png',
    badge: '/logo192.png'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/logo192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || [
      {
        action: 'view',
        title: 'View Deal',
        icon: '/icons/check.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Background sync for checking prices
self.addEventListener('sync', event => {
  if (event.tag === 'check-prices') {
    event.waitUntil(checkPricesInBackground());
  }
});

async function checkPricesInBackground() {
  try {
    // Get stored alerts from IndexedDB
    const alerts = await getStoredAlerts();
    
    if (alerts.length === 0) return;

    // Check prices
    const response = await fetch('/api/prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        routes: alerts.map(a => `${a.origin}|${a.destination}`)
      })
    });

    if (!response.ok) return;

    const data = await response.json();
    const priceDrops = [];

    // Check for price drops
    alerts.forEach(alert => {
      const routeKey = `${alert.origin}-${alert.destination}`;
      const newPrice = data.prices[routeKey];
      
      if (newPrice && newPrice <= alert.targetPrice && newPrice < alert.currentPrice) {
        priceDrops.push({
          ...alert,
          newPrice,
          saved: alert.currentPrice - newPrice
        });
      }
    });

    // Show notifications for price drops
    for (const drop of priceDrops) {
      await self.registration.showNotification(
        `✈️ Price Drop Alert!`,
        {
          body: `${drop.origin} → ${drop.destination} is now $${drop.newPrice} (saved $${drop.saved})`,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: `price-drop-${drop.id}`,
          requireInteraction: true,
          vibrate: [300, 100, 300],
          data: {
            url: '/alerts',
            alertId: drop.id
          }
        }
      );
    }
  } catch (error) {
    console.error('Background price check failed:', error);
  }
}

// Helper function to get alerts from IndexedDB
async function getStoredAlerts() {
  // In a real implementation, this would read from IndexedDB
  // For now, return empty array
  return [];
}