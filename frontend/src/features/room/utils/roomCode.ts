/**
 * Room codes, Google Meet style: 10 lowercase letters shown as "abc-defg-hij". Input is accepted in
 * any case, with or without dashes/spaces, or as a full invite link. Older 6-character codes keep working.
 */

/** Lowercase letters/digits only; null if the input can't be a code. */
export function canonicalCode(input: string): string | null {
  const code = input.toLowerCase().replace(/[^a-z0-9]/g, '')
  return code.length >= 4 && code.length <= 32 ? code : null
}

/** "abcdefghij" → "abc-defg-hij"; other lengths unchanged. */
export function formatCode(code: string): string {
  const c = canonicalCode(code) ?? code
  return /^[a-z]{10}$/.test(c) ? `${c.slice(0, 3)}-${c.slice(3, 7)}-${c.slice(7)}` : c
}

/** Extracts a code from a pasted invite link (…/abc-defg-hij, …/room/join/abc) or a typed code. */
export function parseCodeInput(input: string): string | null {
  const trimmed = input.trim()
  try {
    const url = new URL(trimmed)
    const last = url.pathname.split('/').filter(Boolean).pop()
    return last ? canonicalCode(last) : null
  } catch {
    return canonicalCode(trimmed)
  }
}

/** Whether a URL segment looks like a room code (so `/:code` doesn't swallow typos of app pages). */
export function looksLikeRoomCode(segment: string): boolean {
  return /^[a-z]{3}-?[a-z]{4}-?[a-z]{3}$/i.test(segment) || /^[a-z0-9]{6}$/i.test(segment)
}
