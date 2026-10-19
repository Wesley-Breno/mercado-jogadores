import type { HTMLAttributes } from 'react'

import { cn } from '../../lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn('rounded-xl border border-zinc-200 bg-white shadow-xs', className)}
      {...props}
    />
  )
}
