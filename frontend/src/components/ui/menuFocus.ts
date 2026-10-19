import type { KeyboardEvent } from 'react'

const ITEM_SELECTOR = '[role^="menuitem"]:not(:disabled)'

/** On opening, the focus goes to the checked option or, if there is none, to the first one. */
export function focusFirstItem(menu: HTMLElement | null): void {
  const items = [...(menu?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [])]
  ;(items.find((item) => item.getAttribute('aria-checked') === 'true') ?? items[0])?.focus()
}

/** Up and down arrows move between the options of a menu, going around at the ends. */
export function moveFocusWithArrows(event: KeyboardEvent<HTMLElement>): void {
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
