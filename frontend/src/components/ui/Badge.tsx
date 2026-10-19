import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'outline'

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-800',
  outline: 'border-zinc-200 bg-white text-zinc-700',
}

const DOTS: Record<BadgeTone, string> = {
  neutral: 'bg-zinc-500',
  success: 'bg-green-600',
  warning: 'bg-amber-600',
  danger: 'bg-red-600',
  outline: 'bg-zinc-500',
}

type BadgeProps = {
  tone?: BadgeTone
  dot?: boolean
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'outline', dot = false, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className={cn('size-1.5 rounded-full', DOTS[tone])} />}
      {children}
    </span>
  )
}
