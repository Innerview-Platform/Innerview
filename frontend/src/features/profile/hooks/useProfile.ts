import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/features/profile/api/profileApi'
import type { ProfilePayload, UserProfile } from '@/features/profile/types'
import { toApiError } from '@/lib/apiError'

export const profileKeys = {
  all: ['profile'] as const,
  mine: () => [...profileKeys.all, 'me'] as const,
  public: (username: string) => [...profileKeys.all, 'public', username.toLowerCase()] as const,
  /** Everything keyed by a user id: rating, interview history. */
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

export function usePublicProfile(username: string | undefined) {
  return useQuery({
    queryKey: profileKeys.public(username ?? ''),
    queryFn: () => profileApi.getPublic(username!),
    enabled: Boolean(username),
    // A missing username is a 404: show "not found" right away instead of retrying.
    retry: (count, error) => count < 2 && (toApiError(error).status ?? 500) >= 500,
  })
}

export function useUserRating(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.rating(userId ?? ''),
    queryFn: () => profileApi.getRating(userId!),
    enabled: Boolean(userId),
  })
}

/** Keeps the cached profile in sync after a change; public profiles are refetched on next view. */
function useProfileCache() {
  const queryClient = useQueryClient()
  return {
    patch: (changes: Partial<UserProfile>) =>
      queryClient.setQueryData<UserProfile>(profileKeys.mine(), (current) => (current ? { ...current, ...changes } : current)),
    set: (profile: UserProfile) => queryClient.setQueryData(profileKeys.mine(), profile),
    invalidatePublic: () => queryClient.invalidateQueries({ queryKey: [...profileKeys.all, 'public'] }),
  }
}

export function useUpdateProfile() {
  const cache = useProfileCache()
  return useMutation({
    mutationFn: (payload: ProfilePayload) => profileApi.update(payload),
    onSuccess: (profile) => {
      cache.set(profile)
      cache.invalidatePublic()
    },
  })
}

export function useUploadAvatar() {
  const cache = useProfileCache()
  return useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: (urls) => {
      cache.patch(urls)
      cache.invalidatePublic()
    },
  })
}

export function useDeleteAvatar() {
  const cache = useProfileCache()
  return useMutation({
    mutationFn: profileApi.deleteAvatar,
    onSuccess: () => {
      cache.patch({ avatar_url: null, avatar_thumb_url: null })
      cache.invalidatePublic()
    },
  })
}

export function useUploadResume() {
  const cache = useProfileCache()
  return useMutation({
    mutationFn: profileApi.uploadResume,
    onSuccess: (resume) => cache.patch({ resume }),
  })
}

export function useDeleteResume() {
  const cache = useProfileCache()
  return useMutation({
    mutationFn: profileApi.deleteResume,
    onSuccess: () => cache.patch({ resume: null }),
  })
}
