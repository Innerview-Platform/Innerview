import { apiClient } from '@/lib/axios'
import type {
  OwnedProblem,
  Problem,
  ProblemFilters,
  ProblemPayload,
  SubmissionResult,
  TestCase,
  TestCasePayload,
} from '@/features/problems/types'
import type { SpringPage } from '@/types/api'

const clean = ({ search, difficulty, tag, isActive }: ProblemFilters) => ({
  search: search?.trim() || undefined,
  difficulty,
  tag: tag?.trim() || undefined,
  isActive,
})

export const problemsApi = {
  /** GET /api/problems — everyone's problems. */
  async list(filters: ProblemFilters, page: number, size: number): Promise<SpringPage<Problem>> {
    const { data } = await apiClient.get<SpringPage<Problem>>('/api/problems', { params: { ...clean(filters), page, size } })
    return data
  },

  /** GET /api/problems/mine — the signed-in user's problems (with solutions). */
  async mine(filters: ProblemFilters, page: number, size: number): Promise<SpringPage<OwnedProblem>> {
    const { data } = await apiClient.get<SpringPage<OwnedProblem>>('/api/problems/mine', { params: { ...clean(filters), page, size } })
    return data
  },

  /** GET /api/problems/{slug} — always the public view (no solution), even for the owner. */
  async bySlug(slug: string): Promise<Problem> {
    const { data } = await apiClient.get<Problem>(`/api/problems/${encodeURIComponent(slug)}`)
    return data
  },

  async create(payload: ProblemPayload): Promise<OwnedProblem> {
    const { data } = await apiClient.post<OwnedProblem>('/api/problems', payload)
    return data
  },

  async update(id: string, payload: Partial<ProblemPayload>): Promise<OwnedProblem> {
    const { data } = await apiClient.put<OwnedProblem>(`/api/problems/${id}`, payload)
    return data
  },

  /** DELETE /api/problems/{id} — archives it (soft delete); restore brings it back. */
  async archive(id: string): Promise<void> {
    await apiClient.delete(`/api/problems/${id}`)
  },

  async restore(id: string): Promise<OwnedProblem> {
    const { data } = await apiClient.patch<OwnedProblem>(`/api/problems/${id}/restore`)
    return data
  },

  /** Owners get every case; everyone else only the samples. */
  async testCases(problemId: string): Promise<TestCase[]> {
    const { data } = await apiClient.get<TestCase[]>(`/api/problems/${problemId}/test-cases`)
    return data
  },

  async addTestCase(problemId: string, payload: TestCasePayload): Promise<TestCase[]> {
    const { data } = await apiClient.post<TestCase[]>(`/api/problems/${problemId}/test-cases`, payload)
    return data
  },

  async updateTestCase(problemId: string, testCaseId: string, payload: TestCasePayload): Promise<TestCase[]> {
    const { data } = await apiClient.put<TestCase[]>(`/api/problems/${problemId}/test-cases/${testCaseId}`, payload)
    return data
  },

  async deleteTestCase(problemId: string, testCaseId: string): Promise<void> {
    await apiClient.delete(`/api/problems/${problemId}/test-cases/${testCaseId}`)
  },

  /** POST /api/problems/{id}/run — runs code against the sample cases and answers right away. */
  async runSamples(problemId: string, body: { code: string; language: string }): Promise<SubmissionResult> {
    const { data } = await apiClient.post<SubmissionResult>(`/api/problems/${problemId}/run`, body)
    return data
  },

  /** POST /api/sessions/{interviewId}/submissions — queues judging; poll `submission` for the verdict. */
  async submit(interviewId: number, body: { code: string; language: string; problemId: string }): Promise<string> {
    const { data } = await apiClient.post<{ submissionId: string }>(`/api/sessions/${interviewId}/submissions`, body)
    return data.submissionId
  },

  async submission(id: string): Promise<SubmissionResult> {
    const { data } = await apiClient.get<SubmissionResult>(`/api/submissions/${id}`)
    return data
  },
}
