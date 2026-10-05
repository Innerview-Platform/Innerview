import type { EditorLanguage } from '@/features/room/components/CollaborativeEditor'
import type { ProgrammingLanguage } from '@/features/languages/api/languagesApi'

/**
 * The judge accepts a language only if its name is in the shared programming-language catalog
 * (case-insensitive), then lowercases it and hands it to the code runner. So the name we send must
 * be both: a catalog entry AND a name the runner understands. These are the runner's own names and
 * aliases for each editor language — "Type script" (with a space) is in the catalog but isn't one.
 */
const RUNNER_NAMES: Record<EditorLanguage, string[]> = {
  python: ['python', 'python3', 'py', 'py3'],
  javascript: ['javascript', 'js', 'node', 'node-js'],
  typescript: ['typescript', 'ts'],
  c: ['c', 'gcc'],
  'c++': ['c++', 'cpp', 'g++'],
  java: ['java'],
  go: ['go', 'golang'],
  rust: ['rust', 'rs'],
  csharp: ['csharp', 'c#', 'cs', 'mono'],
}

/** The catalog spelling to send for an editor language, or null if the catalog has none the runner accepts. */
export function judgeLanguageFor(language: EditorLanguage, catalog: ProgrammingLanguage[] | undefined): string | null {
  const accepted = RUNNER_NAMES[language]
  return catalog?.find((entry) => accepted.includes(entry.name.trim().toLowerCase()))?.name ?? null
}

/** The editor language for a catalog entry (problem solutions), if it's one the editor knows. */
export function editorLanguageFor(catalogName: string | null | undefined): EditorLanguage | null {
  const name = catalogName?.trim().toLowerCase()
  if (!name) return null
  return (Object.keys(RUNNER_NAMES) as EditorLanguage[]).find((language) => RUNNER_NAMES[language].includes(name)) ?? null
}
