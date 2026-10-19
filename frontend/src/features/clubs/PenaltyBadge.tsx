import { Check } from 'lucide-react'

import { Badge, type BadgeTone } from '../../components/ui/Badge'

function toneOf(rate: number): BadgeTone {
  if (rate === 0) {
    return 'success'
  }
  return rate >= 20 ? 'danger' : 'warning'
}

/** The % of penalty the API returned, colored like the mockup: 0% green, 5–10% amber, 20% red. */
export function PenaltyBadge({ rate }: { rate: number }) {
  return (
    <Badge tone={toneOf(rate)}>
      {rate === 0 && <Check aria-hidden className="size-3" />}
      {rate}%
    </Badge>
  )
}
