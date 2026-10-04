import type { EmploymentStatus } from '@/constants/enums'

/** `LoginResponse` body — the backend only exposes id and email for the signed-in user. */
export interface AuthUser {
  id: string
  email: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterPayload {
  username: string
  name: string
  email: string
  password: string
  password_confirmation: string
  employment_status: EmploymentStatus
  /** Required when employment_status is EMPLOYED. */
  company: string
  university: string
  college: string
  headline: string
}

/** UsernameAvailabilityResponse */
export interface UsernameAvailability {
  username: string
  available: boolean
  reason: string | null
}

export interface RegisterResponse {
  userId: string
  message: string
}

export interface ResetPasswordPayload {
  token: string
  new_password: string
  new_password_confirm: string
}
