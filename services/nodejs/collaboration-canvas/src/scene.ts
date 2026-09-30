/** Wire format intentionally contains only shared document data, never a participant's viewport or tools. */
export interface SceneElement extends Record<string, unknown> {
  id: string
  type: string
  version: number
  versionNonce: number
  index?: string | null
}

export interface Scene {
  elements: SceneElement[]
  files: Record<string, unknown>
}

export const MAX_SCENE_BYTES = 8 * 1024 * 1024

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function isScene(value: unknown): value is Scene {
  if (!isRecord(value) || !Array.isArray(value.elements) || !isRecord(value.files)) return false
  const ids = new Set<string>()
  for (const element of value.elements) {
    if (!isRecord(element) || typeof element.id !== 'string' || !element.id || ids.has(element.id) ||
      typeof element.type !== 'string' || !Number.isSafeInteger(element.version) || Number(element.version) < 1 ||
      !Number.isSafeInteger(element.versionNonce) || Number(element.versionNonce) < 0 ||
      (element.index != null && typeof element.index !== 'string')) return false
    ids.add(element.id)
  }
  for (const [id, file] of Object.entries(value.files)) {
    if (!isRecord(file) || file.id !== id || typeof file.mimeType !== 'string' ||
      typeof file.dataURL !== 'string' || !file.dataURL.startsWith('data:')) return false
  }
  return true
}

/** Match Excalidraw's deterministic version/nonce reconciliation and fractional stacking order. */
export function mergeScene(current: Scene, incoming: Scene): Scene {
  const elements = new Map(current.elements.map((element) => [element.id, element]))
  for (const next of incoming.elements) {
    const previous = elements.get(next.id)
    if (!previous || next.version > previous.version ||
      (next.version === previous.version && next.versionNonce < previous.versionNonce)) elements.set(next.id, next)
  }
  const ordered = [...elements.values()].sort((a, b) => {
    if (a.index && b.index && a.index !== b.index) return a.index < b.index ? -1 : 1
    return 0
  })
  const referenced = new Set(ordered.filter((element) => element.type === 'image' && !element.isDeleted).map((element) => element.fileId))
  const files = Object.fromEntries(Object.entries({ ...current.files, ...incoming.files }).filter(([id]) => referenced.has(id)))
  return { elements: ordered, files }
}
