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
  const canvasTarget = env.VITE_DEV_CANVAS_TARGET || 'http://localhost:5858'
  const editorTarget = env.VITE_DEV_EDITOR_TARGET || 'http://localhost:1234'
  const port = Number(env.PORT || env.FRONTEND_PORT || 3000)

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
      // Google OAuth redirects back to FRONTEND_URL, so never drift to another port.
      strictPort: true,
      proxy: {
        // Google sign-in (Spring Security OAuth2). Like nginx in production, keep the browser's Host so
        // the backend's redirects stay on this origin. Listed before '/api' so it matches first.
        '/api/auth/google': { target: proxyTarget, changeOrigin: false },
        '/oauth2': { target: proxyTarget, changeOrigin: false },
        '/login/oauth2': { target: proxyTarget, changeOrigin: false },
        '/api': { target: proxyTarget, changeOrigin: true, ...stripOrigin },
        '/ws-signal': { target: proxyTarget, ws: true, changeOrigin: true, ...stripOrigin },
        // Excalidraw sync server (services/nodejs/collaboration-canvas) for the shared whiteboard.
        '/canvas': { target: canvasTarget, ws: true, changeOrigin: true, rewrite: (p) => p.replace(/^\/canvas/, '') },
        // Hocuspocus server (services/nodejs/collaboration-editor) for the shared code editor and notes.
        '/collab': { target: editorTarget, ws: true, changeOrigin: true, rewrite: (p) => p.replace(/^\/collab/, '') },
      },
    },
    preview: { port },
    build: {
      // The largest chunks (CodeMirror, LiveKit) are lazy-loaded inside the interview room only.
      chunkSizeWarningLimit: 900,
    },
  }
})
