import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/common/Button'
import { Alert } from '@/components/feedback/Alert'
import { FormField } from '@/components/forms/FormField'
import { PasswordInput, Select, TextInput } from '@/components/forms/controls'
import { EMPLOYMENT_STATUS_LABELS, EMPLOYMENT_STATUSES } from '@/constants/enums'
import { AuthHeading } from '@/components/layout/AuthLayout'
import { GoogleSignIn } from '@/features/auth/components/GoogleSignIn'
import { PasswordChecklist } from '@/features/auth/components/PasswordChecklist'
import { useRegister } from '@/features/auth/hooks/useAuthMutations'
import { UsernameField } from '@/features/profile/components/UsernameField'
import { useUsernameAvailability } from '@/features/profile/hooks/useUsernameAvailability'
import { registerSchema, type RegisterFormValues } from '@/features/auth/validation/authSchemas'
import { sessionStarted } from '@/features/auth/slices/authSlice'
import { useAppDispatch } from '@/app/hooks'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage, toApiError } from '@/lib/apiError'
import { paths } from '@/routes/paths'
import { PUBLIC_PAGES } from '@/seo/site'
import type { RedirectState } from '@/routes/guards'

export default function RegisterPage() {
  useDocumentTitle(PUBLIC_PAGES.signup.title)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const registerUser = useRegister()

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      employment_status: undefined,
      company: '',
      university: '',
      college: '',
      headline: '',
    },
  })
  const password = useWatch({ control, name: 'password' })
  const employmentStatus = useWatch({ control, name: 'employment_status' })
  const usernameStatus = useUsernameAvailability(useWatch({ control, name: 'username' }))

  const onSubmit = handleSubmit((values) => {
    if (usernameStatus.state === 'taken') {
      setError('username', { message: usernameStatus.message }, { shouldFocus: true })
      return
    }
    registerUser.mutate({ ...values, company: values.employment_status === 'EMPLOYED' ? values.company : '' }, {
      onSuccess: (session) => {
        if (session) {
          toast.success('Account created', { description: 'Add a photo and your links to round out your profile.' })
          const from = (location.state as RedirectState | null)?.from
          navigate(from?.startsWith('/') ? from : paths.settings, { replace: true })
          dispatch(sessionStarted(session))
        } else {
          toast.success('Account created — please sign in.')
          navigate(paths.login, { replace: true, state: { email: values.email } })
        }
      },
    })
  })

  const error = registerUser.error ? toApiError(registerUser.error) : null
  // 409 is also returned when someone claimed the username a moment ago.
  const emailTaken = error?.status === 409 && !error.serverMessage?.toLowerCase().includes('username')

  return (
    <>
      <AuthHeading title="Create your account" description="Join developers practicing real interviews." />

      {error && (
        <Alert tone="danger" className="mb-5" title={emailTaken ? 'Email already registered' : undefined}>
          {error.status === 400 && error.serverMessage?.startsWith('Invalid Email')
            ? "We couldn't verify that email address. Please use a real, reachable mailbox."
            : getErrorMessage(error)}
          {emailTaken && (
            <>
              {' '}
              <Link to={paths.login} className="font-medium text-primary-hover hover:underline">
                Sign in instead
              </Link>
            </>
          )}
        </Alert>
      )}

      <GoogleSignIn label="Sign up with Google" returnTo={(location.state as RedirectState | null)?.from} />

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="Full name" error={errors.name?.message}>
          {(field) => <TextInput {...field} autoComplete="name" placeholder="Jane Doe" autoFocus {...register('name')} />}
        </FormField>

        <UsernameField registration={register('username')} status={usernameStatus} error={errors.username?.message} />

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

        <div className="mt-1 border-t border-border pt-4">
          <p className="text-sm font-medium">About you</p>
          <p className="text-xs text-fg-muted">Shown on your profile to interview partners. You can upload a resume later.</p>
        </div>

        <FormField label="Headline" optional error={errors.headline?.message}>
          {(field) => <TextInput {...field} placeholder="Backend Engineer" {...register('headline')} />}
        </FormField>

        <FormField label="Employment" error={errors.employment_status?.message}>
          {(field) => (
            <Select {...field} defaultValue="" {...register('employment_status')}>
              <option value="" disabled>
                Select…
              </option>
              {EMPLOYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {EMPLOYMENT_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        {employmentStatus === 'EMPLOYED' && (
          <FormField label="Company" error={errors.company?.message}>
            {(field) => <TextInput {...field} autoComplete="organization" placeholder="Acme Inc." {...register('company')} />}
          </FormField>
        )}

        <FormField label="University" error={errors.university?.message}>
          {(field) => <TextInput {...field} placeholder="Cairo University" {...register('university')} />}
        </FormField>

        <FormField label="College" error={errors.college?.message}>
          {(field) => <TextInput {...field} placeholder="Faculty of Engineering" {...register('college')} />}
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
