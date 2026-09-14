import { z } from 'zod'

// Rules below mirror the backend DTO annotations — keep them in sync.

/** LoginRequest: @NotBlank @Email email, @NotBlank password */
export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email can't be empty").email('Invalid email format'),
  password: z.string().min(1, "Password can't be empty"),
})
export type LoginFormValues = z.infer<typeof loginSchema>

/** RegisterRequest regexes, copied verbatim from the DTO. */
const REGISTER_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'number', label: 'One number', test: (v: string) => /\d/.test(v) },
  { id: 'special', label: 'One special character', test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
] as const

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').min(3, 'Name must be at least 3 characters long'),
    email: z.string().trim().min(1, "Email can't be empty").regex(REGISTER_EMAIL_REGEX, 'Invalid email format'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
        'Password must contain at least one uppercase letter, one number, and one special character',
      ),
    password_confirmation: z.string().min(1, "Confirm password can't be empty"),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ['password_confirmation'],
    message: "Password and confirmation don't match",
  })
export type RegisterFormValues = z.infer<typeof registerSchema>

/** ForgetPasswordRequest */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
})
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

/** ResetPasswordRequest + UserServiceImpl.resetPassword checks (match, length >= 8). */
export const resetPasswordSchema = z
  .object({
    new_password: z.string().min(1, 'New password is required.').min(8, 'Password must be at least 8 characters.'),
    new_password_confirm: z.string().min(1, 'Password confirmation is required.'),
  })
  .refine((values) => values.new_password === values.new_password_confirm, {
    path: ['new_password_confirm'],
    message: 'Passwords do not match.',
  })
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
