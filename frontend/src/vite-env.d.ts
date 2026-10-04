/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the API. Leave empty to use the same origin as the SPA (required for login, see README). */
  readonly VITE_API_BASE_URL?: string
  /** LiveKit server WebSocket URL used for interview video, e.g. ws://localhost:7880 */
  readonly VITE_LIVEKIT_URL?: string
  /** Dev-server only: backend the Vite proxy forwards /api and /ws-signal to. */
  readonly VITE_DEV_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
