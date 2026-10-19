import { ChevronDown, type LucideIcon } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'

import { cn } from '../../lib/cn'

type PopoverProps = {
  label: ReactNode
  icon?: LucideIcon
  active?: boolean
  disabled?: boolean
  align?: 'start' | 'end'
  popup: 'menu' | 'dialog'
  panelLabel: string
  children: (close: () => void) => ReactNode
}

/**
 * Button that opens a floating panel (a menu or a small form). It closes on Escape, on a click
 * outside or when the content calls `close`. On phones the panel becomes a sheet at the bottom,
 * so it never widens the page.
 */
export function Popover({
  label,
  icon: Icon,
  active = false,
  disabled = false,
  align = 'start',
  popup,
  panelLabel,
  children,
}: PopoverProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerId = useId()
  const panelId = useId()

  /** Closes and gives the focus back to the button, as menus do. */
  function close() {
    setOpen(false)
    document.getElementById(triggerId)?.focus()
  }

  useEffect(() => {
    if (!open) {
      return
    }
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        document.getElementById(triggerId)?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, triggerId])

  return (
    <div ref={rootRef} className="relative">
      <button
        id={triggerId}
        type="button"
        aria-expanded={open}
        aria-haspopup={popup}
        aria-controls={open ? panelId : undefined}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex h-9 max-w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium shadow-xs transition-colors hover:bg-zinc-50',
          'focus-visible:ring-3 focus-visible:ring-blue-600/30 focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
          active ? 'text-zinc-950' : 'text-zinc-600',
        )}
      >
        {Icon && <Icon aria-hidden />}
        <span className="truncate">{label}</span>
        <ChevronDown aria-hidden className="text-zinc-500" />
      </button>
      {open && (
        <div
          id={panelId}
          role={popup === 'dialog' ? 'dialog' : undefined}
          aria-label={popup === 'dialog' ? panelLabel : undefined}
          className={cn(
            'fixed inset-x-4 bottom-4 z-30 rounded-xl border border-zinc-200 bg-white shadow-md',
            'sm:absolute sm:inset-x-auto sm:top-full sm:bottom-auto sm:mt-1.5 sm:min-w-56',
            align === 'start' ? 'sm:left-0' : 'sm:right-0',
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}
