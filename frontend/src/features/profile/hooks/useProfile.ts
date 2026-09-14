import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppSelector } from '@/app/hooks'
import { selectCurrentUser } from '@/features/auth/slices/authSlice'
import { profileApi } from '@/features/profile/api/profileApi'
import type { ProfilePayload, UserProfile } from '@/features/profile/types'

export const profileKeys = {
  all: ['profile'] as const,
  mine: () => [...profileKeys.all, 'me'] as const,
  /** Everything keyed by a user id: rating, interview history, feedback. */
  user: (userId: string) => ['users', userId] as const,
  rating: (userId: string) => [...profileKeys.user(userId), 'rating'] as const,
}

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.mine(),
    queryFn: profileApi.getMine,
    staleTime: 5 * 60_000,
  })
}

/** Rating is only available once the user has a profile, so callers pass `enabled`. */
export function useUserRating(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: profileKeys.rating(userId ?? ''),
    queryFn: () => profileApi.getRating(userId!),
    enabled: Boolean(userId) && enabled,
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()
  const user = useAppSelector(selectCurrentUser)
  return useMutation({
    mutationFn: (payload: ProfilePayload) => profileApi.create(payload),
    onSuccess: (profile: UserProfile) => {
      queryClient.setQueryData(profileKeys.mine(), profile)
      // Rating, history and feedback become available once a profile exists.
      if (user) queryClient.invalidateQueries({ queryKey: profileKeys.user(user.id) })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProfilePayload) => profileApi.update(payload),
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.mine(), profile),
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()
  const user = useAppSelector(selectCurrentUser)
  return useMutation({
    mutationFn: profileApi.remove,
    onSuccess: () => {
      // Profile-scoped endpoints now answer 404; drop their data instead of refetching it.
      if (user) queryClient.removeQueries({ queryKey: profileKeys.user(user.id) })
      queryClient.setQueryData(profileKeys.mine(), null)
    },
  })
}
