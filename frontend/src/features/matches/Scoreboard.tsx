import type { MatchSide, MatchSummary } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { formatDateTime } from '../../lib/format'
import { RESULT_LABELS, RESULT_TONES } from './labels'

function Side({ side, role, align }: { side: MatchSide; role: string; align: 'left' | 'right' }) {
  return (
    <div className={align === 'right' ? 'text-right' : 'text-left'}>
      <p className="font-semibold">{side.club_name}</p>
      <p className="text-xs text-zinc-500">
        {role} · {side.formation}
      </p>
    </div>
  )
}

/** Score as the API returned it: the home club on the left, the away club on the right. */
export function Scoreboard({ match }: { match: MatchSummary }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
      <Side side={match.home} role="Mandante" align="right" />
      <div className="grid justify-items-center gap-1">
        <p
          aria-label={`${match.home.goals} a ${match.away.goals}`}
          className="rounded-lg bg-zinc-100 px-3 py-1 text-2xl font-semibold tabular-nums"
        >
          {match.home.goals} × {match.away.goals}
        </p>
        <p className="text-xs text-zinc-500">{formatDateTime(match.played_at)}</p>
        <Badge tone={RESULT_TONES[match.result]}>{RESULT_LABELS[match.result]}</Badge>
      </div>
      <Side side={match.away} role="Visitante" align="left" />
    </div>
  )
}
