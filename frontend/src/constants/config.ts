const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const config = {
  /** Empty string means "same origin as the SPA" — see README for why that is required. */
  apiBaseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? ''),
  livekitUrl: import.meta.env.VITE_LIVEKIT_URL ?? '',
} as const

/** STOMP endpoint. Spring registers `/ws-signal` with SockJS, whose raw WebSocket transport lives at `/websocket`. */
export function getSignalingUrl(): string {
  const httpOrigin = config.apiBaseUrl || window.location.origin
  const url = new URL('/ws-signal/websocket', httpOrigin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}
