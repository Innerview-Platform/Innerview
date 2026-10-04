import { apiClient } from '@/lib/axios'
import { ApiError } from '@/lib/apiError'
import type { MessageResponse } from '@/types/api'
import type {
  AuthUser,
  LoginCredentials,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
} from '@/features/auth/types'

export interface LoginResult {
  user: AuthUser
  accessToken: string
}

export const authApi = {
  /** POST /api/auth/login — the access token is only delivered in the `Authorization` response header. */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const response = await apiClient.post<AuthUser>('/api/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password,
    })
    const header = response.headers['authorization'] as string | undefined
    const accessToken = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null

    if (!accessToken) {
      // Happens when the API is called cross-origin: the backend does not expose the header via CORS.
      throw new ApiError('unknown', response.status, null)
    }
    return { user: { id: response.data.id, email: response.data.email }, accessToken }
  },

  /** POST /api/auth/register — does not sign the user in. */
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>('/api/auth/register', payload)
    return data
  },

  /** POST /api/auth/logout — needs the bearer token and the httpOnly refresh_token cookie. */
  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout')
  },

  /** POST /api/auth/forgot-password — always answers with the same message. */
  async forgotPassword(email: string): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/api/auth/forgot-password', { email: email.trim() })
    return data
  },

  /** POST /api/auth/reset-password */
  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/api/auth/reset-password', payload)
    return data
  },
}
