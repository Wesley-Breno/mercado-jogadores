import { Ellipsis, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { focusFirstItem, moveFocusWithArrows } from './menuFocus'
import { Popover } from './Popover'

type RowAction = {
  label: string
  icon: LucideIcon
  onSelect: () => void
}

type ActionListProps = {
  title: string
  actions: RowAction[]
  onPick: (action: RowAction) => void
}

function ActionList({ title, actions, onPick }: ActionListProps) {
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
      className="p-1"
    >
      <p aria-hidden className="truncate px-2 py-1.5 text-xs text-zinc-500">
        {title}
      </p>
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          role="menuitem"
          onClick={() => onPick(action)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none"
        >
          <action.icon aria-hidden className="size-4 text-zinc-500" />
          {action.label}
        </button>
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
