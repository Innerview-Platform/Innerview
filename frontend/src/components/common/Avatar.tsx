import { useState } from 'react'
import { cn } from '@/lib/utils'

const GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-violet-500 to-fuchsia-500',
  'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
]

function initialsFor(label: string) {
  const base = label.split('@')[0] ?? label
  const parts = base.split(/[\s._-]+/).filter(Boolean)
  const letters = parts.length > 1 ? `${parts[0]![0]}${parts[1]![0]}` : base.slice(0, 2)
  return letters.toUpperCase()
}

interface AvatarProps {
  /** Name, email or id used for initials and a stable color. */
  label: string
  src?: string | null
  size?: number
  className?: string
}

export function Avatar({ label, src, size = 36, className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = Boolean(src) && failedSrc !== src
  const gradient = GRADIENTS[[...label].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % GRADIENTS.length]

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-semibold text-white',
        gradient,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      aria-hidden
    >
      {showImage ? (
        <img src={src!} alt="" className="h-full w-full object-cover" onError={() => setFailedSrc(src ?? null)} />
      ) : (
        initialsFor(label)
      )}
    </span>
  )
}
