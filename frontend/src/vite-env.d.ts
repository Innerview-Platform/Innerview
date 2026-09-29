/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the API. Leave empty to use the same origin as the SPA (required for login, see README). */
  readonly VITE_API_BASE_URL?: string
  /** LiveKit server WebSocket URL used for interview video, e.g. ws://localhost:7880 */
  readonly VITE_LIVEKIT_URL?: string
  /** tldraw sync server base URL (default: `/canvas` on the SPA origin). */
  readonly VITE_CANVAS_URL?: string
  /** Hocuspocus (shared editor/notes) base URL (default: `/collab` on the SPA origin). */
  readonly VITE_COLLAB_URL?: string
  /** tldraw license key; required for production (HTTPS) deployments. */
  readonly VITE_TLDRAW_LICENSE_KEY?: string
  /** Dev-server only: backend the Vite proxy forwards /api and /ws-signal to. */
  readonly VITE_DEV_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
