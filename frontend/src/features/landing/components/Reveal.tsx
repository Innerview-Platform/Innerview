import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** True once the element has scrolled into view (stays true). */
export function useInView<T extends Element>(options: IntersectionObserverInit = { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  const { rootMargin, threshold } = options

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setInView(true)
        observer.disconnect()
      }
    }, { rootMargin, threshold })
    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return [ref, inView] as const
}

/** Fades content up as it scrolls into view; `delay` staggers siblings. Reduced motion shows it at once. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      data-shown={inView}
      style={{ transitionDelay: inView ? `${delay}ms` : undefined }}
      className={cn(
        'transition-[opacity,transform] duration-700 ease-[var(--ease-out-soft)] data-[shown=false]:translate-y-5 data-[shown=false]:opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
