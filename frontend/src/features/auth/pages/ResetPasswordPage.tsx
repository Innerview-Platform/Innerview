import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { Button, buttonClasses } from '@/components/common/Button'
import { Alert } from '@/components/feedback/Alert'
import { FormField } from '@/components/forms/FormField'
import { PasswordInput } from '@/components/forms/controls'
import { AuthHeading } from '@/components/layout/AuthLayout'
import { useAppSelector } from '@/app/hooks'
import { useResetPassword } from '@/features/auth/hooks/useAuthMutations'
import { selectIsAuthenticated } from '@/features/auth/slices/authSlice'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/validation/authSchemas'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage, isApiErrorStatus } from '@/lib/apiError'
import { paths } from '@/routes/paths'

export default function ResetPasswordPage() {
  useDocumentTitle('Choose a new password')
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const resetPassword = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: '', new_password_confirm: '' },
  })

  const onSubmit = handleSubmit((values) => resetPassword.mutate({ token, ...values }))

  if (!token) {
    return (
      <>
        <AuthHeading title="Invalid reset link" description="This link is missing its reset token. Request a new one to continue." />
        <Link to={paths.forgotPassword} className={buttonClasses({ size: 'lg', className: 'w-full' })}>
          Request a new link
        </Link>
      </>
    )
  }

  if (resetPassword.isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-success/30 bg-success/10 text-success">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <AuthHeading title="Password updated" description={resetPassword.data.message} />
        <Link to={isAuthenticated ? paths.dashboard : paths.login} className={buttonClasses({ size: 'lg', className: 'w-full' })}>
          {isAuthenticated ? 'Go to dashboard' : 'Sign in'}
        </Link>
      </div>
    )
  }

  // The backend does not whitelist /api/auth/reset-password, so it rejects requests without a valid session.
  const blockedByAuth = !isAuthenticated && isApiErrorStatus(resetPassword.error, 401)

  return (
    <>
      <AuthHeading title="Choose a new password" description="Your new password must be at least 8 characters." />
      {resetPassword.error && (
        <Alert tone="danger" className="mb-5" title={blockedByAuth ? "The server didn't accept this request" : undefined}>
          {blockedByAuth
            ? 'The InnerView server currently only accepts password resets from a signed-in session. Please contact support.'
            : getErrorMessage(resetPassword.error)}
          {!blockedByAuth && isApiErrorStatus(resetPassword.error, 400) && (
            <>
              {' '}
              <Link to={paths.forgotPassword} className="font-medium text-primary-hover hover:underline">
                Request a new link
              </Link>
            </>
          )}
        </Alert>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="New password" error={errors.new_password?.message}>
          {(field) => <PasswordInput {...field} autoComplete="new-password" autoFocus {...register('new_password')} />}
        </FormField>
        <FormField label="Confirm new password" error={errors.new_password_confirm?.message}>
          {(field) => <PasswordInput {...field} autoComplete="new-password" {...register('new_password_confirm')} />}
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={resetPassword.isPending}>
          Update password
        </Button>
      </form>
    </>
  )
}
