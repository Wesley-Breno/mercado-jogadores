import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

type ResultItem = {
  label: string
  hint?: string
  value: ReactNode
  highlight?: boolean
}

/** Values returned by the API after an action, one per line, with what each one means. */
export function ResultList({ items }: { items: ResultItem[] }) {
  return (
    <dl className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex items-center justify-between gap-4 px-4 py-3',
            item.highlight && 'bg-zinc-50',
          )}
        >
          <dt>
            <span className={cn('block text-sm', item.highlight && 'font-semibold')}>
              {item.label}
            </span>
            {item.hint && <span className="block text-xs text-zinc-500">{item.hint}</span>}
          </dt>
          <dd className={cn('text-sm tabular-nums', item.highlight && 'text-base font-semibold')}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
