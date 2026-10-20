import { cn } from '../../lib/cn'
import { FOCUS_RING } from './buttonStyles'

type Segment<Value> = {
  value: Value
  label: string
  count?: number
  disabled?: boolean
  title?: string
}

type SegmentedControlProps<Value> = {
  label: string
  segments: Segment<Value>[]
  selected: Value
  onSelect: (value: Value) => void
}

export function SegmentedControl<Value>({
  label,
  segments,
  selected,
  onSelect,
}: SegmentedControlProps<Value>) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-zinc-100 p-0.5">
      {segments.map((segment) => {
        const isSelected = segment.value === selected
        return (
          <button
            key={segment.label}
            type="button"
            aria-pressed={isSelected}
            disabled={segment.disabled}
            title={segment.title}
            onClick={() => onSelect(segment.value)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors',
              FOCUS_RING,
              'disabled:cursor-not-allowed disabled:opacity-50',
              isSelected ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-950',
            )}
          >
            {segment.label}
            {segment.count !== undefined && (
              <span className="text-zinc-500 tabular-nums">{segment.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
