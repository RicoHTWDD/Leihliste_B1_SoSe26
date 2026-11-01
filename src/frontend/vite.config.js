import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Alle Aufrufe an /api/... werden an Django weitergeleitet.
    // In Docker: http://backend:8000 (gesetzt in docker-compose.yml)
    // Lokal ohne Docker: http://localhost:8000
    proxy: {
      '/api': process.env.API_PROXY_TARGET || 'http://localhost:8000',
    },
  },
})