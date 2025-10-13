module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,css,html,ico,png,svg,json,ttf,woff2}'],
  swDest: 'dist/sw.js',
  // The navigateFallback is the page that will be shown when the user is offline
  // and tries to access a page that is not cached.
  navigateFallback: '/offline.html',
  runtimeCaching: [
    {
      // Cache pages (HTML) with a Network First strategy.
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 3, // Fallback to cache if network is slow.
      },
    },
    {
      // Cache static assets (JS, CSS) with a Stale While Revalidate strategy.
      urlPattern: ({ request }) =>
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'worker',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
      },
    },
    {
      // Cache images with a Cache First strategy.
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
      },
    },
  ],
  // These options ensure the new service worker activates quickly
  // and takes control of the page for a smooth update experience.
  skipWaiting: true,
  clientsClaim: true,
};