import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { reviewsApi, type ReviewDirection } from '@/features/feedback/api/reviewsApi'

export const reviewKeys = {
  all: ['reviews'] as const,
  list: (direction: ReviewDirection, params: { rating?: number; page: number; size: number }) =>
    [...reviewKeys.all, direction, params] as const,
  detail: (id: number) => [...reviewKeys.all, 'detail', id] as const,
}

export function useReviews(direction: ReviewDirection, params: { rating?: number; page: number; size: number }) {
  return useQuery({
    queryKey: reviewKeys.list(direction, params),
    queryFn: () => (direction === 'received' ? reviewsApi.received(params) : reviewsApi.given(params)),
    placeholderData: keepPreviousData,
  })
}

export function useReviewDetail(id: number | null) {
  return useQuery({
    queryKey: reviewKeys.detail(id ?? 0),
    queryFn: () => reviewsApi.detail(id!),
    enabled: id !== null,
    staleTime: 5 * 60_000,
  })
}
