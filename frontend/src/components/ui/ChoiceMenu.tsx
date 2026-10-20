import { Check, type LucideIcon } from 'lucide-react'

import { cn } from '../../lib/cn'
import { MENU_ITEM, Menu } from './Menu'
import { Popover } from './Popover'

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
function ChoiceMenu<Value>({ title, choices, selected, onSelect }: ChoiceMenuProps<Value>) {
  return (
    <Menu title={title} className="max-h-80 overflow-y-auto">
      {choices.map((choice) => (
        <button
          key={choice.label}
          type="button"
          role="menuitemradio"
          aria-checked={choice.value === selected}
          onClick={() => onSelect(choice.value)}
          className={MENU_ITEM}
        >
          <Check
            aria-hidden
            className={cn('size-4 text-blue-600', choice.value !== selected && 'invisible')}
          />
          {choice.label}
        </button>
      ))}
    </Menu>
  )
}

type ChoiceButtonProps<Value> = ChoiceMenuProps<Value> & {
  label: string
  icon: LucideIcon
  active?: boolean
  disabled?: boolean
  align?: 'start' | 'end'
}

/** Button that opens a single-choice menu; picking an option closes it. */
export function ChoiceButton<Value>({
  label,
  icon,
  active,
  disabled,
  align,
  title,
  onSelect,
  ...menu
}: ChoiceButtonProps<Value>) {
  return (
    <Popover
      icon={icon}
      label={label}
      active={active}
      disabled={disabled}
      align={align}
      popup="menu"
      panelLabel={title}
    >
      {(close) => (
        <ChoiceMenu
          {...menu}
          title={title}
          onSelect={(value) => {
            close()
            onSelect(value)
          }}
        />
      )}
    </Popover>
  )
}
