import { Check, Circle } from 'lucide-react'
import { PASSWORD_RULES } from '@/features/auth/validation/authSchemas'
import { cn } from '@/lib/utils'

export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value)
        return (
          <li key={rule.id} className={cn('flex items-center gap-1.5 text-xs', met ? 'text-success' : 'text-fg-muted')}>
            {met ? <Check className="h-3 w-3" aria-hidden /> : <Circle className="h-2.5 w-2.5" aria-hidden />}
            <span>{rule.label}</span>
            <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
          </li>
        )
      })}
    </ul>
  )
}
