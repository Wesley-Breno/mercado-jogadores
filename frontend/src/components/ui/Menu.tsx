import { type KeyboardEvent, type ReactNode, useEffect, useRef } from 'react'

import { cn } from '../../lib/cn'

const ITEM_SELECTOR = '[role^="menuitem"]:not(:disabled)'

/** On opening, the focus goes to the checked option or, if there is none, to the first one. */
function focusFirstItem(menu: HTMLElement | null): void {
  const items = [...(menu?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [])]
  ;(items.find((item) => item.getAttribute('aria-checked') === 'true') ?? items[0])?.focus()
}

/** Up and down arrows move between the options of a menu, going around at the ends. */
function moveFocusWithArrows(event: KeyboardEvent<HTMLElement>): void {
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

/** Item look shared by the options of every menu. */
export const MENU_ITEM =
  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none'

type MenuProps = {
  title: string
  className?: string
  children: ReactNode
}

/** Menu inside a Popover: a title, the focus on opening and the arrows between the items. */
export function Menu({ title, className, children }: MenuProps) {
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
      className={cn('p-1', className)}
    >
      <p aria-hidden className="truncate px-2 py-1.5 text-xs text-zinc-500">
        {title}
      </p>
      {children}
    </div>
  )
}
