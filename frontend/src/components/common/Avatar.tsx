import { useState } from 'react'
import { cn } from '@/lib/utils'

/** Indigo/violet-family tones (plus a few warm ones) that read well with white initials in both themes. */
const TONES = ['#6366f1', '#7c3aed', '#4f6aa8', '#9333ea', '#4338ca', '#a2445b', '#b2593a', '#6d28d9']

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
  const tone = TONES[[...label].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TONES.length]

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36), backgroundColor: tone }}
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
