import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { problemsApi } from '@/features/problems/api/problemsApi'
import type { ProblemFilters, ProblemPayload, TestCasePayload } from '@/features/problems/types'

export const problemKeys = {
  all: ['problems'] as const,
  list: (scope: 'all' | 'mine', filters: ProblemFilters, page: number, size: number) => [...problemKeys.all, scope, filters, page, size] as const,
  detail: (slug: string) => [...problemKeys.all, 'detail', slug] as const,
  testCases: (id: string) => [...problemKeys.all, 'test-cases', id] as const,
}

export function useProblemList(scope: 'all' | 'mine', filters: ProblemFilters, page: number, size: number, enabled = true) {
  return useQuery({
    queryKey: problemKeys.list(scope, filters, page, size),
    queryFn: () => (scope === 'mine' ? problemsApi.mine(filters, page, size) : problemsApi.list(filters, page, size)),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useProblem(slug: string | undefined) {
  return useQuery({ queryKey: problemKeys.detail(slug ?? ''), queryFn: () => problemsApi.bySlug(slug!), enabled: Boolean(slug) })
}

export function useTestCases(problemId: string | undefined) {
  return useQuery({ queryKey: problemKeys.testCases(problemId ?? ''), queryFn: () => problemsApi.testCases(problemId!), enabled: Boolean(problemId) })
}

/** Create, edit, archive and restore — every change refreshes the problem lists. */
export function useProblemMutations() {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: problemKeys.all })
  return {
    create: useMutation({ mutationFn: (payload: ProblemPayload) => problemsApi.create(payload), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<ProblemPayload> }) => problemsApi.update(id, payload), onSuccess: refresh }),
    archive: useMutation({ mutationFn: (id: string) => problemsApi.archive(id), onSuccess: refresh }),
    restore: useMutation({ mutationFn: (id: string) => problemsApi.restore(id), onSuccess: refresh }),
  }
}

export function useTestCaseMutations(problemId: string) {
  const queryClient = useQueryClient()
  const key = problemKeys.testCases(problemId)
  const setCases = (cases: Awaited<ReturnType<typeof problemsApi.testCases>>) => queryClient.setQueryData(key, cases)
  return {
    add: useMutation({ mutationFn: (payload: TestCasePayload) => problemsApi.addTestCase(problemId, payload), onSuccess: setCases }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: TestCasePayload }) => problemsApi.updateTestCase(problemId, id, payload),
      onSuccess: setCases,
    }),
    remove: useMutation({
      mutationFn: (id: string) => problemsApi.deleteTestCase(problemId, id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    }),
  }
}
