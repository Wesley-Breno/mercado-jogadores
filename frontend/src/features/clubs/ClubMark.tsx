import { cn } from '../../lib/cn'

/** The acronym in a square, the club's "avatar" in tables and in the club header. */
export function ClubMark({ acronym, large = false }: { acronym: string; large?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 font-semibold text-zinc-700',
        large ? 'size-11 text-sm' : 'h-8 w-11 text-xs',
      )}
    >
      {acronym}
    </span>
  )
}
