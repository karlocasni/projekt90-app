import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
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
          }
        ]
      }
    })
  ],
});
