import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// The Spring Boot API returns the access token in the `Authorization` *response* header and
// does not list it in `Access-Control-Expose-Headers`, so browsers can only read it when the
// SPA and the API share an origin. In development the Vite server proxies `/api` and the
// STOMP endpoint to the backend to provide that same origin.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080'
  const port = Number(env.PORT || 3000)

  // Requests are same-origin from the browser's point of view. Dropping the Origin header keeps
  // Spring Security's CORS filter (which only allows `frontend.url`) from rejecting requests and
  // WebSocket upgrades when the dev server runs on a port other than the one the backend expects.
  const stripOrigin: Pick<ProxyOptions, 'configure'> = {
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
      proxy.on('proxyReqWs', (proxyReq) => proxyReq.removeHeader('origin'))
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      port,
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true, ...stripOrigin },
        '/ws-signal': { target: proxyTarget, ws: true, changeOrigin: true, ...stripOrigin },
      },
    },
    preview: { port },
    build: {
      // The largest chunks (CodeMirror, LiveKit) are lazy-loaded inside the interview room only.
      chunkSizeWarningLimit: 900,
    },
  }
})
