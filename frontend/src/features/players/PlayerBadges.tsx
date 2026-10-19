import type { Condition } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/cn'
import { CONDITION_LABELS, CONDITION_TONES } from './labels'

export function ConditionBadge({ condition }: { condition: Condition }) {
  return (
    <Badge tone={CONDITION_TONES[condition]} dot>
      {CONDITION_LABELS[condition]}
    </Badge>
  )
}

function agilityColor(agility: number): string {
  if (agility >= 80) {
    return 'bg-green-600'
  }
  return agility <= 30 ? 'bg-red-600' : 'bg-zinc-400'
}

/** The number plus a small bar: green from 80, red up to 30. */
export function AgilityMeter({ agility }: { agility: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-6 text-right">{agility}</span>
      <span aria-hidden className="h-1 w-7 overflow-hidden rounded-full bg-zinc-200">
        <span
          className={cn('block h-full rounded-full', agilityColor(agility))}
          style={{ width: `${agility}%` }}
        />
      </span>
    </span>
  )
}
