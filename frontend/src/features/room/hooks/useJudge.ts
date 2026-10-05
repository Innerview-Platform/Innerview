import { useCallback, useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { useLanguageCatalog } from '@/features/languages/hooks/useLanguages'
import { problemsApi } from '@/features/problems/api/problemsApi'
import type { SubmissionResult, SubmissionStatus } from '@/features/problems/types'
import { judgeLanguageFor } from '@/features/problems/utils/judgeLanguage'
import type { EditorLanguage } from '@/features/room/components/CollaborativeEditor'
import type { SharedProblem } from '@/features/room/hooks/useSharedProblem'
import { getErrorMessage } from '@/lib/apiError'

export type JudgeKind = 'samples' | 'submission'

export interface JudgeState {
  kind: JudgeKind
  /** running: request in flight; judging: queued submission being polled. */
  phase: 'running' | 'judging' | 'done' | 'error'
  result?: SubmissionResult
  error?: string
  /** From the backend's "unsupported language" error. */
  supportedLanguages?: string[]
}

const PENDING: SubmissionStatus[] = ['PENDING', 'RUNNING']
const POLL_LIMIT_MS = 120_000

const pollDelay = (attempt: number) => (attempt < 10 ? 1_000 : 2_500)

/**
 * Judging for the room's selected library problem: "Run samples" (POST /problems/{id}/run, answers
 * right away) and "Submit" (POST /sessions/{interviewId}/submissions, then GET /submissions/{id}
 * until a final verdict — the backend doesn't push judged results). Results are only for you.
 */
export function useJudge({ problem, interviewId, language }: { problem: SharedProblem | null; interviewId: number; language: EditorLanguage }) {
  const catalog = useLanguageCatalog()
  const judgeLanguage = judgeLanguageFor(language, catalog.data)
  const [state, setState] = useState<JudgeState | null>(null)
  const requestRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // A different problem (or leaving the room): drop results that belong to the old one.
  useEffect(() => {
    requestRef.current += 1
    clearTimeout(timerRef.current)
    setState(null)
  }, [problem?.id])
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const fail = (request: number, kind: JudgeKind, error: unknown) => {
    if (request !== requestRef.current) return
    const body = isAxiosError(error) ? (error.response?.data as { supportedLanguages?: unknown } | undefined) : undefined
    const supported = Array.isArray(body?.supportedLanguages) ? (body.supportedLanguages as string[]) : undefined
    setState({ kind, phase: 'error', error: getErrorMessage(error), supportedLanguages: supported })
  }

  const runSamples = useCallback(
    (code: string) => {
      if (!problem || !judgeLanguage) return
      const request = ++requestRef.current
      clearTimeout(timerRef.current)
      setState({ kind: 'samples', phase: 'running' })
      problemsApi
        .runSamples(problem.id, { code, language: judgeLanguage })
        .then((result) => request === requestRef.current && setState({ kind: 'samples', phase: 'done', result }))
        .catch((error) => fail(request, 'samples', error))
    },
    [problem, judgeLanguage],
  )

  const submit = useCallback(
    async (code: string) => {
      if (!problem || !judgeLanguage) return
      const request = ++requestRef.current
      clearTimeout(timerRef.current)
      setState({ kind: 'submission', phase: 'running' })
      let id: string
      try {
        id = await problemsApi.submit(interviewId, { code, language: judgeLanguage, problemId: problem.id })
      } catch (error) {
        fail(request, 'submission', error)
        return
      }
      if (request !== requestRef.current) return
      setState({ kind: 'submission', phase: 'judging' })
      const started = Date.now()
      const poll = async (attempt: number) => {
        try {
          const result = await problemsApi.submission(id)
          if (request !== requestRef.current) return
          if (!PENDING.includes(result.status)) {
            setState({ kind: 'submission', phase: 'done', result })
            return
          }
          setState({ kind: 'submission', phase: 'judging', result })
        } catch (error) {
          // A blip while polling isn't fatal; give up only after the time limit.
          if (Date.now() - started > POLL_LIMIT_MS) return fail(request, 'submission', error)
        }
        if (Date.now() - started > POLL_LIMIT_MS) {
          setState({ kind: 'submission', phase: 'error', error: 'Judging is taking longer than expected. Check back on this submission later.' })
          return
        }
        timerRef.current = setTimeout(() => void poll(attempt + 1), pollDelay(attempt))
      }
      timerRef.current = setTimeout(() => void poll(0), pollDelay(0))
    },
    [problem, judgeLanguage, interviewId],
  )

  const busy = state?.phase === 'running' || state?.phase === 'judging'
  return { state, busy, judgeLanguage, catalogLoading: catalog.isPending, runSamples, submit, dismiss: () => setState(null) }
}

export type Judge = ReturnType<typeof useJudge>
