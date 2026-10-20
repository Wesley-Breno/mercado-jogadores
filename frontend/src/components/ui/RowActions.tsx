import { Ellipsis, type LucideIcon } from 'lucide-react'
import { useId } from 'react'

import { cn } from '../../lib/cn'
import { MENU_ITEM, Menu } from './Menu'
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
  const menuId = useId()

  return (
    <Menu title={title}>
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
              MENU_ITEM,
              'disabled:pointer-events-none disabled:opacity-50',
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
    </Menu>
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
