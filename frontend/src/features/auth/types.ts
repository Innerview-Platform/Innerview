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
  name: string
  email: string
  password: string
  password_confirmation: string
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
