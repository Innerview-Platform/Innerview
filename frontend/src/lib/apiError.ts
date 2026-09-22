import { isAxiosError } from 'axios'

export type ApiErrorKind = 'network' | 'http' | 'unknown'

/**
 * Normalized error for everything that goes through the API client.
 *
 * The backend uses several error body shapes:
 *  - `{ error: "..." }` from the @RestControllerAdvice handlers (user-facing messages)
 *  - `{ error: "Unauthorized", message: "..." }` from JwtAuthenticationEntryPoint
 *  - Spring's default `{ timestamp, status, error, message, path }` for unhandled exceptions,
 *    whose `message` may contain internal details and must never be shown to users.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  /** Message the backend intends for users, when the body shape indicates one. */
  readonly serverMessage: string | null

  constructor(kind: ApiErrorKind, status: number | null, serverMessage: string | null, cause?: unknown) {
    super(serverMessage ?? `API request failed${status ? ` with status ${status}` : ''}`, { cause })
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.serverMessage = serverMessage
  }
}

function extractServerMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const body = data as Record<string, unknown>

  // Spring's default error body — internal, not safe to display.
  if ('timestamp' in body && 'path' in body) return null

  if (typeof body.message === 'string' && body.error === 'Unauthorized') return body.message
  if (typeof body.error === 'string' && body.error.trim()) return body.error.trim()
  return null
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (isAxiosError(error)) {
    if (!error.response) return new ApiError('network', null, null, error)
    return new ApiError('http', error.response.status, extractServerMessage(error.response.data), error)
  }
  return new ApiError('unknown', null, null, error)
}

const GENERIC_MESSAGES: Record<number, string> = {
  400: 'Some of the information you submitted is invalid.',
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: 'The requested resource was not found.',
  409: 'This conflicts with existing data.',
  410: 'This resource is no longer available.',
  422: 'Some of the information you submitted is invalid.',
}

/** User-friendly message for any error. Server messages are shown for 4xx only. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const apiError = toApiError(error)

  if (apiError.kind === 'network') return "Can't reach the InnerView server. Check your connection and try again."
  if (apiError.status === null) return fallback
  if (apiError.status >= 500) return 'Something went wrong on our side. Please try again in a moment.'
  if (apiError.status === 401 && apiError.serverMessage?.startsWith('Authentication token')) return GENERIC_MESSAGES[401]

  return apiError.serverMessage ?? GENERIC_MESSAGES[apiError.status] ?? fallback
}

export function isApiErrorStatus(error: unknown, status: number): boolean {
  return toApiError(error).status === status
}
