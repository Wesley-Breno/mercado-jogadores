import { cn } from '../../lib/cn'
import { initials } from '../../lib/initials'

const PALETTES = [
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-800',
  'bg-teal-100 text-teal-800',
  'bg-zinc-200 text-zinc-700',
]

type AvatarProps = {
  name: string
  seed: number
  className?: string
}

/** Decorative initials; the color depends only on the seed, so a player keeps the same color. */
export function Avatar({ name, seed, className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full text-xs font-medium',
        PALETTES[seed % PALETTES.length],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
