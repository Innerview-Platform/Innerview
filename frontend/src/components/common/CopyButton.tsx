import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button, type ButtonSize, type ButtonVariant } from '@/components/common/Button'

interface CopyButtonProps {
  value: string
  label?: string
  variant?: ButtonVariant
  size?: ButtonSize
}

export function CopyButton({ value, label = 'Copy', variant = 'secondary', size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={copy}
      leftIcon={copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      aria-label={size === 'icon' ? label : undefined}
    >
      {size === 'icon' ? null : copied ? 'Copied' : label}
    </Button>
  )
}
