import { Link } from 'react-router-dom'
import { buttonClasses } from '@/components/common/Button'
import { Logo } from '@/components/common/Logo'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo size={30} className="mb-12" />
      <p className="font-mono text-sm text-primary-hover">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-fg-secondary">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link to={paths.root} className={buttonClasses({ className: 'mt-8' })}>
        Go home
      </Link>
    </div>
  )
}
