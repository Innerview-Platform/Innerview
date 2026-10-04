const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const config = {
  /** Empty string means "same origin as the SPA" — see README for why that is required. */
  apiBaseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? ''),
  livekitUrl: import.meta.env.VITE_LIVEKIT_URL ?? '',
  /** Excalidraw sync server; defaults to `/canvas` on the SPA's origin (proxied by Vite / nginx). */
  canvasBaseUrl: trimTrailingSlash(import.meta.env.VITE_CANVAS_URL ?? '/canvas'),
  /** Hocuspocus server for the shared code editor and notes; defaults to `/collab` on the SPA's origin. */
  collabBaseUrl: trimTrailingSlash(import.meta.env.VITE_COLLAB_URL ?? '/collab'),
} as const

/** STOMP endpoint. Spring registers `/ws-signal` with SockJS, whose raw WebSocket transport lives at `/websocket`. */
export function getSignalingUrl(): string {
  const httpOrigin = config.apiBaseUrl || window.location.origin
  const url = new URL('/ws-signal/websocket', httpOrigin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

/** Absolute URL on the whiteboard sync server; `ws` switches http(s) to ws(s). */
export function getCanvasUrl(path: string, { ws = false } = {}): string {
  const url = new URL(`${config.canvasBaseUrl}${path}`, window.location.origin)
  if (ws) url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

/** WebSocket URL of the Hocuspocus server (or an HTTP URL on it with `ws: false`). */
export function getCollabUrl(path = '', { ws = true } = {}): string {
  const url = new URL(`${config.collabBaseUrl}${path}`, window.location.origin)
  if (ws) url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}
