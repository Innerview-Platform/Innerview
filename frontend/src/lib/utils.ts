import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins class names; later Tailwind utilities override conflicting earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

/**
 * The backend mixes `Instant` (UTC, with `Z`) and `LocalDateTime` (server-local, no zone) values.
 * Both parse with `new Date()`; LocalDateTime values are interpreted in the browser's zone.
 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '—'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

/** "just now", "5 min ago", "yesterday", then a short date. */
export function formatRelative(epochMs: number, now = Date.now()): string {
  const seconds = Math.round((epochMs - now) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return 'just now'
  if (abs < 3600) return relativeFormatter.format(Math.round(seconds / 60), 'minute')
  if (abs < 86_400) return relativeFormatter.format(Math.round(seconds / 3600), 'hour')
  if (abs < 7 * 86_400) return relativeFormatter.format(Math.round(seconds / 86_400), 'day')
  return dateFormatter.format(new Date(epochMs))
}
