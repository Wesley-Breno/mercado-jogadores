import { Ellipsis, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

import { cn } from '../../lib/cn'
import { focusFirstItem, moveFocusWithArrows } from './menuFocus'
import { Popover } from './Popover'

type RowAction = {
  label: string
  icon: LucideIcon
  onSelect: () => void
  danger?: boolean
  disabled?: boolean
  note?: string
}

type ActionListProps = {
  title: string
  actions: RowAction[]
  onPick: (action: RowAction) => void
}

function ActionList({ title, actions, onPick }: ActionListProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    focusFirstItem(menuRef.current)
  }, [])

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={title}
      onKeyDown={moveFocusWithArrows}
      className="p-1"
    >
      <p aria-hidden className="truncate px-2 py-1.5 text-xs text-zinc-500">
        {title}
      </p>
      {actions.map((action, index) => (
        <div
          key={action.label}
          className={cn(action.danger && 'mt-1 border-t border-zinc-200 pt-1')}
        >
          <button
            type="button"
            role="menuitem"
            disabled={action.disabled}
            aria-describedby={action.note ? `${menuId}-${index}` : undefined}
            onClick={() => onPick(action)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
              action.danger && 'text-red-600',
            )}
          >
            <action.icon
              aria-hidden
              className={cn('size-4', action.danger ? 'text-red-600' : 'text-zinc-500')}
            />
            {action.label}
          </button>
          {action.note && (
            <p id={`${menuId}-${index}`} className="px-2 pb-1 pl-8 text-xs text-zinc-500">
              {action.note}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

type RowActionsProps = {
  title: string
  actions: RowAction[]
}

/** The "⋯" button of a table row, with the actions of that item. */
export function RowActions({ title, actions }: RowActionsProps) {
  return (
    <Popover
      label={`Ações de ${title}`}
      icon={Ellipsis}
      iconOnly
      align="end"
      popup="menu"
      panelLabel={title}
    >
      {(close) => (
        <ActionList
          title={title}
          actions={actions}
          onPick={(action) => {
            close()
            action.onSelect()
          }}
        />
      )}
    </Popover>
  )
}
