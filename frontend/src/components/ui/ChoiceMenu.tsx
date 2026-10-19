import { Check } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { cn } from '../../lib/cn'
import { focusFirstItem, moveFocusWithArrows } from './menuFocus'

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

/** Single-choice menu for a Popover: arrows move between the options, Enter picks one. */
export function ChoiceMenu<Value>({ title, choices, selected, onSelect }: ChoiceMenuProps<Value>) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    focusFirstItem(menuRef.current)
  }, [])

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={title}
      onKeyDown={moveFocusWithArrows}
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
