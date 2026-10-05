import { useCallback, useEffect, useState } from 'react'
import type * as Y from 'yjs'
import type { Difficulty, Problem, TestCase } from '@/features/problems/types'

/** The library problem the room is working on, as stored in the shared problem document. */
export interface SharedProblem {
  id: string
  slug: string
  title: string
  difficulty: Difficulty
}

const MAP = 'problem'

/** Markdown for the shared problem area: the statement plus the sample cases. */
function problemMarkdown(problem: Problem, samples: TestCase[]) {
  const parts = [`# ${problem.title}`, '', problem.statement?.trim() ?? '']
  if (samples.length) {
    parts.push('', '## Examples')
    samples.forEach((sample, index) => {
      parts.push('', `Example ${index + 1}${sample.description ? ` — ${sample.description}` : ''}`, 'Input:', sample.input, 'Output:', sample.expectedOutput)
    })
  }
  return parts.join('\n')
}

/**
 * There's no backend endpoint for "which problem is this interview on", so the choice lives in the
 * room's shared problem document (a Yjs map next to its text). It syncs to everyone through the
 * collaboration server like any edit, and survives reloads.
 */
export function useSharedProblem(doc: Y.Doc, text: Y.Text) {
  const map = doc.getMap<unknown>(MAP)
  const read = useCallback((): SharedProblem | null => {
    const id = map.get('id')
    return typeof id === 'string'
      ? { id, slug: String(map.get('slug') ?? ''), title: String(map.get('title') ?? ''), difficulty: (map.get('difficulty') as Difficulty) ?? 'MEDIUM' }
      : null
  }, [map])
  const [problem, setProblem] = useState<SharedProblem | null>(read)

  useEffect(() => {
    const update = () => setProblem(read())
    update()
    map.observe(update)
    return () => map.unobserve(update)
  }, [map, read])

  /** Loads a library problem for everyone: replaces the shared statement and records its id. */
  const select = useCallback(
    (next: Problem, samples: TestCase[]) => {
      doc.transact(() => {
        text.delete(0, text.length)
        text.insert(0, problemMarkdown(next, samples))
        map.set('id', next.id)
        map.set('slug', next.slug)
        map.set('title', next.title)
        map.set('difficulty', next.difficulty)
      })
    },
    [doc, text, map],
  )

  /** Detaches the library problem (the statement text stays, as notes). */
  const clear = useCallback(() => doc.transact(() => map.clear()), [doc, map])

  return { problem, select, clear }
}
