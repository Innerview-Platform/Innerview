import { Separator } from 'react-resizable-panels'
import { cn } from '@/lib/utils'

/**
 * Gap between two panels that doubles as the drag handle. The line lights up on hover/drag;
 * double-click restores the default sizes.
 */
export function ResizeHandle({ orientation = 'vertical', className }: { orientation?: 'vertical' | 'horizontal'; className?: string }) {
  const vertical = orientation === 'vertical'
  return (
    <Separator
      className={cn(
        'group relative flex shrink-0 items-center justify-center outline-none',
        vertical ? 'w-2.5' : 'h-2.5',
        className,
      )}
    >
      <span
        className={cn(
          'rounded-full bg-transparent transition-colors',
          'group-data-[separator=hover]:bg-primary/60 group-data-[separator=active]:bg-primary group-data-[separator=focus]:bg-primary',
          vertical ? 'h-10 w-1' : 'h-1 w-10',
        )}
        aria-hidden
      />
    </Separator>
  )
}
