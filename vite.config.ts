import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Strip noisy dev-only console calls from production bundles while keeping
  // console.warn / console.error for ErrorBoundary and surfaced runtime errors.
  esbuild: {
    pure: ['console.log', 'console.debug', 'console.info', 'console.trace'],
    legalComments: 'none',
  },
  build: {
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      // En dev : éviter CORS en faisant passer les appels API par le serveur Vite
      '/v2/api': {
        target: 'https://prodapi.zepargn.com',
        changeOrigin: true,
      },
    },
  },
})
