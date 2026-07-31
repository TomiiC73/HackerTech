import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // El backend Flask (app.py) sirve /api/* en el puerto 5001. Proxyearlas
    // desde el dev server de Vite evita configurar CORS y hace que las
    // llamadas fetch("/api/...") funcionen igual en dev que en produccion.
    //
    // Ademas, este frontend React REEMPLAZA solo "/" y "/signup" (ver
    // App.jsx/LoginCard.jsx) - las paginas post-login ("/portal",
    // "/webauthn") siguen siendo Jinja server-side de Flask (ver
    // ../templates/). Por eso una navegacion de pagina completa (no un
    // fetch) a esas rutas TAMBIEN necesita pasar por el proxy: sin esto,
    // `window.location.href = "/portal"` despues de loguearse terminaria
    // pidiendole "/portal" al propio Vite (que no tiene esa ruta) en vez
    // de a Flask.
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/portal': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/webauthn': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/logout': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
