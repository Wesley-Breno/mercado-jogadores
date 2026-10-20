import { Volleyball } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { initials } from '../../lib/initials'

const LINE = 'absolute border-white/30'

type PitchSurfaceProps = {
  /** From xl up the pitch lies down: the bottom goal goes to the left, the top one to the right. */
  wide?: boolean
  className?: string
  children: ReactNode
}

/** The green pitch with its lines; the players go on top of it, in positioned elements. */
export function PitchSurface({ wide = false, className, children }: PitchSurfaceProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-green-700 bg-[repeating-linear-gradient(0deg,transparent_0_2.5rem,rgb(255_255_255/0.05)_2.5rem_5rem)]',
        wide &&
          'xl:bg-[repeating-linear-gradient(90deg,transparent_0_2.5rem,rgb(255_255_255/0.05)_2.5rem_5rem)]',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          LINE,
          'top-0 left-1/2 h-12 w-32 -translate-x-1/2 border border-t-0',
          wide &&
            'xl:top-1/2 xl:right-0 xl:left-auto xl:h-32 xl:w-12 xl:translate-x-0 xl:-translate-y-1/2 xl:border-t xl:border-r-0',
        )}
      />
      <span
        aria-hidden
        className={cn(
          LINE,
          'top-1/2 right-0 left-0 border-t',
          wide && 'xl:top-0 xl:right-auto xl:bottom-0 xl:left-1/2 xl:border-t-0 xl:border-l',
        )}
      />
      <span
        aria-hidden
        className={cn(
          LINE,
          'top-1/2 left-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border',
        )}
      />
      <span
        aria-hidden
        className={cn(
          LINE,
          'bottom-0 left-1/2 h-12 w-32 -translate-x-1/2 border border-b-0',
          wide &&
            'xl:top-1/2 xl:bottom-auto xl:left-0 xl:h-32 xl:w-12 xl:translate-x-0 xl:-translate-y-1/2 xl:border-b xl:border-l-0',
        )}
      />
      {children}
    </div>
  )
}

type PitchMarkerProps = {
  name: string
  tone?: 'home' | 'away'
  unfit?: boolean
  scored?: boolean
}

/**
 * A player on the pitch: the initials in a circle, an orange dot when MAL_CONDICIONADO and a ball
 * when the attack was a goal. Decorative: the text next to it is what screen readers get.
 */
export function PitchMarker({
  name,
  tone = 'home',
  unfit = false,
  scored = false,
}: PitchMarkerProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold ring-2',
        tone === 'home'
          ? 'bg-blue-600 text-white ring-white'
          : 'bg-white text-zinc-900 ring-white/60',
      )}
    >
      {initials(name)}
      {unfit && (
        <span className="absolute -top-0.5 -left-0.5 size-3 rounded-full bg-amber-500 ring-2 ring-green-700" />
      )}
      {scored && (
        <Volleyball className="absolute -top-1 -right-1 size-4 rounded-full bg-white text-zinc-900" />
      )}
    </span>
  )
}
