import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const BASE = '/canfenci-tasks/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Canfenci Tasks',
        short_name: 'Canfenci',
        description: 'Gorev, proje ve fikir yonetimi icin mobil oncelikli PWA',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: `${BASE}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${BASE}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${BASE}icons/icon-maskable-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: `${BASE}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        navigateFallback: `${BASE}index.html`,
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      },
      devOptions: { enabled: true }
    })
  ],
  server: { port: 5173 }
});
