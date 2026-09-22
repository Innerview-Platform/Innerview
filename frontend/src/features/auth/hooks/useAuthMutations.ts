import { useMutation } from '@tanstack/react-query'
import { useAppDispatch } from '@/app/hooks'
import { authApi } from '@/features/auth/api/authApi'
import { loggedOut, sessionStarted } from '@/features/auth/slices/authSlice'
import type { LoginCredentials, RegisterPayload, ResetPasswordPayload } from '@/features/auth/types'

export function useLogin() {
  const dispatch = useAppDispatch()
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: ({ user, accessToken }) => dispatch(sessionStarted({ user, accessToken })),
  })
}

/**
 * Registers and, because the backend does not return a session, signs the new user in right away.
 * Resolves with the new session (or null if the follow-up login failed); the caller starts the
 * session so it can navigate first.
 */
export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      await authApi.register(payload)
      try {
        return await authApi.login({ email: payload.email, password: payload.password })
      } catch {
        return null
      }
    },
  })
}

export function useLogout() {
  const dispatch = useAppDispatch()
  return useMutation({
    mutationFn: () => authApi.logout(),
    // Sign out locally even if the server call fails (e.g. missing cookie); the token is discarded either way.
    onSettled: () => dispatch(loggedOut()),
  })
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => authApi.forgotPassword(email) })
}

export function useResetPassword() {
  return useMutation({ mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload) })
}
