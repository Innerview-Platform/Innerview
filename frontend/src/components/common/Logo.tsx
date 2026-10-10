import { useId } from 'react'
import { cn } from '@/lib/utils'

interface LogoMarkProps {
  size?: number
  /** The code bubble between the two people; dropped by default below 28px, where it turns to noise. */
  bubble?: boolean
  /** Landing page only: the two people shift gently, as if mid-conversation. */
  animated?: boolean
  className?: string
}

/**
 * The InnerViewHub mark: interviewer and candidate meeting across one table, with code passing
 * between them. Blue (left) to violet (right), as in the brand logo.
 */
export function LogoMark({ size = 28, bubble, animated = false, className }: LogoMarkProps) {
  const id = useId().replace(/:/g, '')
  const blue = `iv-blue-${id}`
  const violet = `iv-violet-${id}`
  const showBubble = bubble ?? size >= 28

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden className={cn('shrink-0', className)}>
      <defs>
        <linearGradient id={blue} x1="0.15" y1="0" x2="0.55" y2="1">
          <stop offset="0" stopColor="#4fc4ff" />
          <stop offset="1" stopColor="#3a56f0" />
        </linearGradient>
        <linearGradient id={violet} x1="0.85" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#e2a8ff" />
          <stop offset="1" stopColor="#7650f2" />
        </linearGradient>
      </defs>
      <g className={cn(animated && 'animate-[lean-in_6s_ease-in-out_infinite] [transform-box:fill-box]')}>
        <circle cx="15.5" cy="12.5" r="6.5" fill={`url(#${blue})`} />
      </g>
      <g className={cn(animated && 'animate-[lean-in_6s_ease-in-out_infinite_-3s] [transform-box:fill-box]')}>
        <circle cx="48.5" cy="12.5" r="6.5" fill={`url(#${violet})`} />
      </g>
      <path
        d="M49.5 22.5C56.5 24 59.5 32.5 59.5 40.5C59.5 48 55 53 47.5 53H25C23.3 53 22 51.8 22 50.2C22 48.6 23.3 47.5 25 47.5H43.5C45.6 47.5 46.6 46 46.2 44L43.6 31.5C42.8 26.8 45.5 21.6 49.5 22.5Z"
        fill={`url(#${violet})`}
      />
      <path
        d="M14.5 22.5C7.5 24 4.5 32.5 4.5 40.5C4.5 46.5 8.5 50.5 14 50.5C16.8 50.5 18.6 49 19.6 46H43C44.7 46 46 44.7 46 43C46 41.3 44.7 40 43 40H28C25.3 40 23.7 38.3 22.9 35.5L20.8 28.5C19.6 24.6 17.6 21.8 14.5 22.5Z"
        fill={`url(#${blue})`}
      />
      {showBubble && (
        <g className={cn(animated && 'animate-[bubble-float_6s_ease-in-out_infinite] [transform-box:fill-box]')}>
          <path
            d="M25 4.5H39C41 4.5 42.5 6 42.5 8V14C42.5 16 41 17.5 39 17.5H30.5L27 21V17.5H25C23 17.5 21.5 16 21.5 14V8C21.5 6 23 4.5 25 4.5Z"
            fill="#232848"
            fillOpacity="0.92"
            stroke="#a5b0ff"
            strokeOpacity="0.45"
            strokeWidth="0.8"
          />
          <path
            d="M28.6 8.6 26.4 11l2.2 2.4M35.4 8.6l2.2 2.4-2.2 2.4M33 7.8l-2 6.4"
            stroke="#d4d8ff"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  )
}

/** "Inner" and "Hub" in the text color, "View" in the brand's blue-to-violet. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('text-[17px] font-semibold tracking-tight text-fg', className)}>
      Inner<span className="text-brand-gradient">View</span>Hub
    </span>
  )
}

interface LogoProps {
  size?: number
  className?: string
  /** Show only the mark below the `sm` breakpoint (tight headers on phones). */
  compactOnMobile?: boolean
}

export function Logo({ size = 28, className, compactOnMobile = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      <Wordmark className={cn(compactOnMobile && 'hidden sm:inline')} />
    </span>
  )
}
