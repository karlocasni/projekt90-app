import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    port: 5200,
    host: true
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Projekt90',
        short_name: 'P90',
        description: 'Premium fitness zajednica i tečajevi.',
        theme_color: '#09090b',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Ensure ALL navigation requests (including those with Meta/UTM query
        // params like ?fbclid=...) fall back to index.html. Without this the
        // service worker may fail to match a cached entry and return a network
        // error when the device is offline or the CDN is slow.
        navigateFallback: '/index.html',
        // Allow every URL path to use the fallback (regex matches everything).
        navigateFallbackAllowlist: [/^(?!\/__).*/],
        // Remove caches from older service worker versions automatically.
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Cache images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
            },
          },
          {
            // Cache videos
            urlPattern: /\.(?:mp4|webm|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'videos-cache',
              rangeRequests: true, // Crucial for video seeking
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 Days
              },
            },
          },
          {
            // Cache Google Fonts or Unsplash images
            urlPattern: /^https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|images\.unsplash\.com|api\.dicebear\.com)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'external-assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
              },
            },
          },
          {
            // Cache Firebase Storage media (uploaded images + videos)
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-media-cache',
              rangeRequests: true,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
            },
          }
        ]
      }
    })
  ],
});
