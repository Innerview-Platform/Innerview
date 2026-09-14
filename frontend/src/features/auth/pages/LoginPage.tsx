import { Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/common/Button'
import { Alert } from '@/components/feedback/Alert'
import { FormField } from '@/components/forms/FormField'
import { PasswordInput, TextInput } from '@/components/forms/controls'
import { AuthHeading } from '@/components/layout/AuthLayout'
import { useLogin } from '@/features/auth/hooks/useAuthMutations'
import { loginSchema, type LoginFormValues } from '@/features/auth/validation/authSchemas'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage, toApiError } from '@/lib/apiError'
import { paths } from '@/routes/paths'

interface LoginLocationState {
  email?: string
  from?: string
}

export default function LoginPage() {
  useDocumentTitle('Sign in')
  const location = useLocation()
  const state = (location.state as LoginLocationState | null) ?? {}
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: state.email ?? '', password: '' },
  })

  // GuestRoute performs the redirect once the session is stored.
  const onSubmit = handleSubmit((values) => login.mutate(values))

  const errorMessage = login.error
    ? toApiError(login.error).kind === 'unknown'
      ? 'Signed in, but the session token could not be read. The app must be served from the same origin as the API.'
      : getErrorMessage(login.error)
    : null

  return (
    <>
      <AuthHeading title="Welcome back" description="Sign in to continue your interview preparation." />

      {state.from && state.from !== paths.dashboard && !login.error && (
        <Alert tone="info" className="mb-5">
          Please sign in to continue.
        </Alert>
      )}
      {errorMessage && (
        <Alert tone="danger" className="mb-5">
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="Email" error={errors.email?.message}>
          {(field) => <TextInput {...field} type="email" autoComplete="email" placeholder="you@example.com" autoFocus {...register('email')} />}
        </FormField>

        <div>
          <FormField label="Password" error={errors.password?.message}>
            {(field) => <PasswordInput {...field} autoComplete="current-password" placeholder="••••••••" {...register('password')} />}
          </FormField>
          <div className="mt-2 text-right">
            <Link to={paths.forgotPassword} className="text-xs text-primary-hover hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-1 w-full" loading={login.isPending}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Don&apos;t have an account?{' '}
        <Link to={paths.register} state={state.from ? { from: state.from } : undefined} className="font-medium text-primary-hover hover:underline">
          Create one
        </Link>
      </p>
    </>
  )
}
