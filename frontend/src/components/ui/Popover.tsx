import { ChevronDown, type LucideIcon } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '../../lib/cn'
import { BUTTON_BASE } from './buttonStyles'

type PopoverProps = {
  label: string
  icon?: LucideIcon
  iconOnly?: boolean
  active?: boolean
  disabled?: boolean
  align?: 'start' | 'end'
  popup: 'menu' | 'dialog'
  panelLabel: string
  children: (close: () => void) => ReactNode
}

const GAP = 6
const MIN_SPACE_BELOW = 280

/** Where the panel goes on wider screens: under the button, or above it near the bottom. */
function panelPlace(trigger: HTMLElement, align: 'start' | 'end'): CSSProperties {
  const rect = trigger.getBoundingClientRect()
  const vertical =
    window.innerHeight - rect.bottom < MIN_SPACE_BELOW && rect.top > MIN_SPACE_BELOW
      ? { '--popover-bottom': `${window.innerHeight - rect.top + GAP}px` }
      : { '--popover-top': `${rect.bottom + GAP}px` }
  const horizontal =
    align === 'start'
      ? { '--popover-left': `${rect.left}px` }
      : { '--popover-right': `${window.innerWidth - rect.right}px` }
  return { ...vertical, ...horizontal } as CSSProperties
}

/**
 * Button that opens a floating panel (a menu or a small form). The panel is drawn over the page,
 * so a table that scrolls does not cut it, and follows the button when the page scrolls. It closes
 * on Escape, on a click outside or when the content calls `close`. On phones it is a sheet at the
 * bottom.
 */
export function Popover({
  label,
  icon: Icon,
  iconOnly = false,
  active = false,
  disabled = false,
  align = 'start',
  popup,
  panelLabel,
  children,
}: PopoverProps) {
  const [place, setPlace] = useState<CSSProperties | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerId = useId()
  const panelId = useId()
  const open = place !== null

  /** Closes and gives the focus back to the button, as menus do. */
  function close() {
    setPlace(null)
    document.getElementById(triggerId)?.focus()
  }

  useEffect(() => {
    if (!open) {
      return
    }
    function isInside(target: EventTarget | null): boolean {
      return (
        target instanceof Node &&
        Boolean(rootRef.current?.contains(target) || panelRef.current?.contains(target))
      )
    }
    function closeOnOutsideClick(event: PointerEvent) {
      if (!isInside(event.target)) {
        setPlace(null)
      }
    }
    function followTrigger(event: Event) {
      const trigger = document.getElementById(triggerId)
      if (trigger && !isInside(event.target)) {
        setPlace(panelPlace(trigger, align))
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPlace(null)
        document.getElementById(triggerId)?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('scroll', followTrigger, true)
    window.addEventListener('resize', followTrigger)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('scroll', followTrigger, true)
      window.removeEventListener('resize', followTrigger)
    }
  }, [open, triggerId, align])

  return (
    <div ref={rootRef} className={cn('relative', iconOnly && 'inline-flex')}>
      <button
        id={triggerId}
        type="button"
        aria-label={iconOnly ? label : undefined}
        aria-expanded={open}
        aria-haspopup={popup}
        aria-controls={open ? panelId : undefined}
        disabled={disabled}
        onClick={(event) => setPlace(open ? null : panelPlace(event.currentTarget, align))}
        className={cn(
          'inline-flex items-center rounded-lg text-sm font-medium transition-colors',
          BUTTON_BASE,
          iconOnly
            ? 'size-8 justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950'
            : 'h-9 max-w-full gap-2 border border-zinc-200 bg-white px-3 shadow-xs hover:bg-zinc-50',
          !iconOnly && (active ? 'text-zinc-950' : 'text-zinc-600'),
        )}
      >
        {Icon && <Icon aria-hidden />}
        {!iconOnly && <span className="truncate">{label}</span>}
        {!iconOnly && <ChevronDown aria-hidden className="text-zinc-500" />}
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role={popup === 'dialog' ? 'dialog' : undefined}
            aria-label={popup === 'dialog' ? panelLabel : undefined}
            style={place}
            className={cn(
              'fixed inset-x-4 bottom-4 z-40 rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-md',
              'sm:inset-x-auto sm:top-(--popover-top) sm:bottom-(--popover-bottom) sm:min-w-56',
              align === 'start' ? 'sm:left-(--popover-left)' : 'sm:right-(--popover-right)',
            )}
          >
            {children(close)}
          </div>,
          document.body,
        )}
    </div>
  )
}
