export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' }

/**
 * ProblemResponseDTO (public view). The DTO's `active` flag isn't mapped by the backend (it's always
 * serialized as false), so the UI never reads it; active/archived comes from the `isActive` filter.
 */
export interface Problem {
  id: string
  title: string
  slug: string
  statement: string | null
  difficulty: Difficulty
  tags: string[]
  timeLimitMs: number | null
  memoryLimitMb: number | null
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string } | null
}

/** ProblemOwnerDTO — your own problems, with the reference solution. */
export interface OwnedProblem extends Problem {
  solutionCode: string | null
  /** A catalog entry; the backend only fills `id` here. */
  solutionLanguage: { id: string; name: string | null } | null
}

/** CreateProblemRequest / UpdateProblemRequest. The backend requires a solution language on create. */
export interface ProblemPayload {
  title: string
  statement: string
  difficulty: Difficulty
  tags: string[]
  timeLimitMs?: number
  memoryLimitMb?: number
  solutionCode?: string
  solutionLanguage: { id: string }
}

/** TestCaseDto — `sample` cases are visible to everyone; the rest only to the problem's owner. */
export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  sample: boolean
  orderIndex: number
  description: string | null
  weight: number | null
}

export type TestCasePayload = Omit<TestCase, 'id' | 'orderIndex'>

export interface ProblemFilters {
  search?: string
  difficulty?: Difficulty
  tag?: string
  /** true = active only, false = archived only (backend `isActive` filter). */
  isActive?: boolean
}

export type SubmissionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'COMPILE_ERROR'
  | 'RUNTIME_ERROR'
  | 'SKIPPED'

/** SubmissionResultDTO — per-test results carry only index, verdict and duration (no outputs). */
export interface SubmissionResult {
  submissionId: string | null
  sessionId: number | null
  problemId: string
  status: SubmissionStatus
  score: number | null
  totalDurationMs: number | null
  testResults: { testIndex: number; status: SubmissionStatus; durationMs: number | null }[]
}
