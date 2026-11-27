import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

const backend = process.env.API_PROXY_TARGET || 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Django liefert die API und die gespeicherten Exemplarbilder.
    // In Docker: http://backend:8000 (gesetzt in docker-compose.yml)
    // Lokal ohne Docker: http://localhost:8000
    proxy: {
      '/api': backend,
      '/media/': backend,
    },
  },
})
