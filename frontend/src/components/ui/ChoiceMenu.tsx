import { Check } from 'lucide-react'
import { type KeyboardEvent, useEffect, useRef } from 'react'

import { cn } from '../../lib/cn'

export type Choice<Value> = {
  value: Value
  label: string
}

type ChoiceMenuProps<Value> = {
  title: string
  choices: Choice<Value>[]
  selected: Value
  onSelect: (value: Value) => void
}

const ITEM_SELECTOR = '[role="menuitemradio"]'

/** Single-choice menu for a Popover: arrows move between the options, Enter picks one. */
export function ChoiceMenu<Value>({ title, choices, selected, onSelect }: ChoiceMenuProps<Value>) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const menu = menuRef.current
    const current = menu?.querySelector<HTMLElement>(`${ITEM_SELECTOR}[aria-checked="true"]`)
    ;(current ?? menu?.querySelector<HTMLElement>(ITEM_SELECTOR))?.focus()
  }, [])

  function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 }
    const step = steps[event.key]
    if (step === undefined) {
      return
    }
    event.preventDefault()
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>(ITEM_SELECTOR)]
    const index = items.indexOf(document.activeElement as HTMLElement)
    items[(index + step + items.length) % items.length]?.focus()
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={title}
      onKeyDown={moveFocus}
      className="max-h-80 overflow-y-auto p-1"
    >
      <p aria-hidden className="px-2 py-1.5 text-xs text-zinc-500">
        {title}
      </p>
      {choices.map((choice) => (
        <button
          key={choice.label}
          type="button"
          role="menuitemradio"
          aria-checked={choice.value === selected}
          onClick={() => onSelect(choice.value)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none"
        >
          <Check
            aria-hidden
            className={cn('size-4 text-blue-600', choice.value !== selected && 'invisible')}
          />
          {choice.label}
        </button>
      ))}
    </div>
  )
}
