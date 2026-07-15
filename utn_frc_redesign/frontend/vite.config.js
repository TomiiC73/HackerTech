import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // El backend Flask (app.py) sirve todas las rutas /api/* en el puerto
    // 5001. Proxyearlas desde el dev server de Vite evita configurar CORS
    // y hace que las llamadas fetch("/api/...") funcionen igual en dev
    // que en produccion (donde Flask serviría el build de este frontend).
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
