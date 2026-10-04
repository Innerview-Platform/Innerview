import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/common/Button'
import { Alert } from '@/components/feedback/Alert'
import { FormField } from '@/components/forms/FormField'
import { PasswordInput, TextInput } from '@/components/forms/controls'
import { AuthHeading } from '@/components/layout/AuthLayout'
import { PasswordChecklist } from '@/features/auth/components/PasswordChecklist'
import { useRegister } from '@/features/auth/hooks/useAuthMutations'
import { registerSchema, type RegisterFormValues } from '@/features/auth/validation/authSchemas'
import { sessionStarted } from '@/features/auth/slices/authSlice'
import { useAppDispatch } from '@/app/hooks'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage, toApiError } from '@/lib/apiError'
import { paths } from '@/routes/paths'
import type { RedirectState } from '@/routes/guards'

export default function RegisterPage() {
  useDocumentTitle('Create account')
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const registerUser = useRegister()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '' },
  })
  const password = useWatch({ control, name: 'password' })

  const onSubmit = handleSubmit((values) =>
    registerUser.mutate(values, {
      onSuccess: (session) => {
        if (session) {
          toast.success('Account created', { description: 'Set up your profile to get the most out of InnerView.' })
          const from = (location.state as RedirectState | null)?.from
          navigate(from?.startsWith('/') ? from : paths.profile, { replace: true })
          dispatch(sessionStarted(session))
        } else {
          toast.success('Account created — please sign in.')
          navigate(paths.login, { replace: true, state: { email: values.email } })
        }
      },
    }),
  )

  const error = registerUser.error ? toApiError(registerUser.error) : null

  return (
    <>
      <AuthHeading title="Create your account" description="Join developers practicing real interviews." />

      {error && (
        <Alert tone="danger" className="mb-5" title={error.status === 409 ? 'Email already registered' : undefined}>
          {error.status === 400 && error.serverMessage?.startsWith('Invalid Email')
            ? "We couldn't verify that email address. Please use a real, reachable mailbox."
            : getErrorMessage(error)}
          {error.status === 409 && (
            <>
              {' '}
              <Link to={paths.login} className="font-medium text-primary-hover hover:underline">
                Sign in instead
              </Link>
            </>
          )}
        </Alert>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="Full name" error={errors.name?.message}>
          {(field) => <TextInput {...field} autoComplete="name" placeholder="Jane Doe" autoFocus {...register('name')} />}
        </FormField>

        <FormField label="Email" error={errors.email?.message}>
          {(field) => <TextInput {...field} type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />}
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          {(field) => <PasswordInput {...field} autoComplete="new-password" placeholder="••••••••" {...register('password')} />}
        </FormField>
        <PasswordChecklist value={password} />

        <FormField label="Confirm password" error={errors.password_confirmation?.message}>
          {(field) => <PasswordInput {...field} autoComplete="new-password" placeholder="••••••••" {...register('password_confirmation')} />}
        </FormField>

        <Button type="submit" size="lg" className="mt-1 w-full" loading={registerUser.isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link to={paths.login} state={location.state} className="font-medium text-primary-hover hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
