import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  cacheDir: '.vite-cache',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.svg'],
      manifest: {
        name: 'DigiWisata - Pelaporan Data Wisata',
        short_name: 'DigiWisata',
        description: 'Aplikasi pelaporan data wisata untuk pengelola dan petugas lapangan',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/.env']
    }
  }
})
