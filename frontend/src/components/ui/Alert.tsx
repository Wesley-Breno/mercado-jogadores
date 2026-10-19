import { AlertCircle, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

type AlertProps = {
  tone?: 'danger' | 'warning'
  children: ReactNode
}

/**
 * Danger shows the `message` of a refusal and is read aloud as soon as it appears; warning tells
 * what an action will cause before it is sent.
 */
export function Alert({ tone = 'danger', children }: AlertProps) {
  const Icon = tone === 'danger' ? AlertCircle : TriangleAlert
  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      className={cn(
        'flex gap-2 rounded-lg border px-3 py-2.5 text-sm',
        tone === 'danger'
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-amber-200 bg-amber-50 text-amber-800',
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
