import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'

type IconType = ComponentType<{ className?: string }>

interface ControlButtonProps {
  label: string
  icon: IconType
  /** `off`: muted/stopped (red); `active`: e.g. sharing your screen (primary). */
  state?: 'on' | 'off' | 'active'
  disabled?: boolean
  pressed?: boolean
  onClick?: () => void
}

export function ControlButton({ label, icon: Icon, state = 'on', disabled, pressed, onClick }: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        state === 'on' && 'bg-elevated text-fg hover:bg-border',
        state === 'off' && 'bg-danger/15 text-danger hover:bg-danger/25',
        state === 'active' && 'bg-primary text-on-primary hover:bg-primary-hover',
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  )
}
