/* Minimal service worker for PWA installability */
self.addEventListener('install', (event) => {
  // Activate worker immediately after installation
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Become available to all pages
  event.waitUntil(self.clients.claim());
});

// Basic passthrough fetch handler (keeps network default behavior)
self.addEventListener('fetch', () => {
  // no-op
});

// Optional: basic offline fallback caching can be added later
