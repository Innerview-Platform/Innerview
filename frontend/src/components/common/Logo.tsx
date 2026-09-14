import { cn } from '@/lib/utils'

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#6366F1" />
      <circle cx="12" cy="16" r="4" fill="white" fillOpacity="0.9" />
      <circle cx="20" cy="16" r="4" fill="white" fillOpacity="0.4" />
    </svg>
  )
}

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      <span className="text-base font-bold tracking-tight text-fg">InnerView</span>
    </span>
  )
}
