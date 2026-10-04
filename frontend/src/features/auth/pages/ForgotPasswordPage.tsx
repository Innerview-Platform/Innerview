import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { Button, buttonClasses } from '@/components/common/Button'
import { Alert } from '@/components/feedback/Alert'
import { FormField } from '@/components/forms/FormField'
import { TextInput } from '@/components/forms/controls'
import { AuthHeading } from '@/components/layout/AuthLayout'
import { useForgotPassword } from '@/features/auth/hooks/useAuthMutations'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/validation/authSchemas'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/apiError'
import { paths } from '@/routes/paths'

export default function ForgotPasswordPage() {
  useDocumentTitle('Forgot password')
  const forgotPassword = useForgotPassword()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(({ email }) => forgotPassword.mutate(email))

  if (forgotPassword.isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-success/30 bg-success/10 text-success">
          <MailCheck className="h-5 w-5" />
        </div>
        <AuthHeading title="Check your inbox" description={forgotPassword.data.message} />
        <p className="-mt-3 text-sm text-fg-muted">
          We sent instructions to <span className="text-fg-secondary">{getValues('email')}</span>. The link expires in 15 minutes.
        </p>
        <Link to={paths.login} className={buttonClasses({ variant: 'secondary', size: 'lg', className: 'mt-8 w-full' })}>
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <AuthHeading title="Reset your password" description="Enter your account email and we'll send you a reset link." />
      {forgotPassword.error && (
        <Alert tone="danger" className="mb-5">
          {getErrorMessage(forgotPassword.error)}
        </Alert>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="Email" error={errors.email?.message}>
          {(field) => <TextInput {...field} type="email" autoComplete="email" placeholder="you@example.com" autoFocus {...register('email')} />}
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={forgotPassword.isPending}>
          Send reset link
        </Button>
      </form>
      <Link to={paths.login} className="mt-6 flex items-center justify-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </Link>
    </>
  )
}
