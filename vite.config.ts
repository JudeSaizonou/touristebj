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
  server: {
    port: 5173,
    proxy: {
      // En dev : éviter CORS en faisant passer les appels API par le serveur Vite
      '/v2/api': {
        target: 'http://localhost:5121',
        changeOrigin: true,
      },
    },
  },
})
