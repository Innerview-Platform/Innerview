import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const controlBase = cn(
  'w-full rounded-lg border border-border bg-elevated text-sm text-fg placeholder:text-fg-muted',
  'transition-[border-color,box-shadow] outline-none',
  'focus:border-primary focus:ring-3 focus:ring-primary/20',
  'aria-invalid:border-danger/70 aria-invalid:focus:ring-danger/20',
  'disabled:cursor-not-allowed disabled:opacity-60',
)

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlBase, 'h-10 px-3', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(controlBase, 'min-h-24 resize-y px-3 py-2 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select className={cn(controlBase, 'h-10 cursor-pointer appearance-none bg-no-repeat px-3 pr-9', className)} style={selectArrow} {...props}>
      {children}
    </select>
  )
}

const selectArrow = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2371717a' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundPosition: 'right 0.65rem center',
}

export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <TextInput type={visible ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-fg-muted hover:text-fg"
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
