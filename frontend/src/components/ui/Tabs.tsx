import type { LucideIcon } from 'lucide-react'
import { type KeyboardEvent, type ReactNode, useId } from 'react'

import { cn } from '../../lib/cn'
import { FOCUS_RING } from './buttonStyles'

type Tab<Key extends string> = {
  key: Key
  label: string
  icon: LucideIcon
  count?: number
}

type TabsProps<Key extends string> = {
  label: string
  tabs: Tab<Key>[]
  selected: Key
  onSelect: (key: Key) => void
  children: ReactNode
}

/** Tabs with the ARIA pattern: left and right arrows move between them; the panel follows. */
export function Tabs<Key extends string>({
  label,
  tabs,
  selected,
  onSelect,
  children,
}: TabsProps<Key>) {
  const baseId = useId()
  const tabId = (key: Key) => `${baseId}-tab-${key}`
  const panelId = `${baseId}-panel`

  function moveWithArrows(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 }
    const step = steps[event.key]
    if (step === undefined) {
      return
    }
    const index = tabs.findIndex((tab) => tab.key === selected)
    const next = tabs[(index + step + tabs.length) % tabs.length]
    onSelect(next.key)
    document.getElementById(tabId(next.key))?.focus()
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={moveWithArrows}
        className="mb-4 flex gap-1 overflow-x-auto border-b border-zinc-200"
      >
        {tabs.map(({ key, label: tabLabel, icon: Icon, count }) => {
          const isSelected = key === selected
          return (
            <button
              key={key}
              id={tabId(key)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelect(key)}
              className={cn(
                '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                FOCUS_RING,
                isSelected
                  ? 'border-blue-600 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-950',
              )}
            >
              <Icon aria-hidden className="size-4" />
              {tabLabel}
              {count !== undefined && (
                <span
                  className={cn(
                    'rounded-md px-1.5 text-xs tabular-nums',
                    isSelected ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-600',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={tabId(selected)}>
        {children}
      </div>
    </div>
  )
}
