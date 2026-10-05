import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTheme, type ThemePreference } from '@/lib/theme'
import { cn } from '@/lib/utils'

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

/**
 * `icon`: one button that flips between light and dark (headers).
 * `segmented`: light / dark / system (sidebar, settings).
 */
export function ThemeToggle({ variant = 'icon', className }: { variant?: 'icon' | 'segmented'; className?: string }) {
  const { preference, theme, setPreference } = useTheme()

  if (variant === 'icon') {
    const next = theme === 'dark' ? 'light' : 'dark'
    const Icon = theme === 'dark' ? Sun : Moon
    return (
      <button
        type="button"
        onClick={() => setPreference(next)}
        className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-fg-secondary transition-colors hover:bg-elevated hover:text-fg', className)}
        aria-label={`Switch to ${next} theme`}
        title={`Switch to ${next} theme`}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </button>
    )
  }

  return (
    <div role="radiogroup" aria-label="Theme" className={cn('flex items-center gap-0.5 rounded-lg border border-border bg-bg p-0.5', className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            title={`${label} theme`}
            className={cn(
              'flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors',
              active ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
