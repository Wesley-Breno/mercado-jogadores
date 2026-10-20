import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import type { MatchSummary } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { type Column, DataTable } from '../../components/ui/DataTable'
import { dateTimeParts } from '../../lib/format'
import { RESULT_LABELS, RESULT_TONES } from './labels'

const COLUMNS: Column<MatchSummary>[] = [
  {
    key: 'played_at',
    header: 'Data e hora',
    cell: (match) => {
      const { date, time } = dateTimeParts(match.played_at)
      return (
        <span>
          {date} <span className="text-zinc-500">{time}</span>
        </span>
      )
    },
  },
  {
    key: 'home',
    header: 'Mandante',
    align: 'right',
    cell: (match) => <span className="font-medium">{match.home.club_name}</span>,
  },
  {
    key: 'score',
    header: 'Placar',
    cell: (match) => (
      <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-semibold">
        {match.home.goals} × {match.away.goals}
      </span>
    ),
  },
  {
    key: 'away',
    header: 'Visitante',
    cell: (match) => <span className="font-medium">{match.away.club_name}</span>,
  },
  {
    key: 'result',
    header: 'Resultado',
    cell: (match) => <Badge tone={RESULT_TONES[match.result]}>{RESULT_LABELS[match.result]}</Badge>,
  },
  {
    key: 'open',
    header: <span className="sr-only">Abrir</span>,
    align: 'right',
    cell: (match) => (
      <Link
        to={`/partidas/${match.id}`}
        aria-label={`Ver duelos de ${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}`}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
      >
        Ver duelos
        <ChevronRight aria-hidden className="size-4" />
      </Link>
    ),
  },
]

type MatchesTableProps = {
  matches: MatchSummary[] | undefined
  isUpdating: boolean
  error: Error | null
  onRetry: () => void
  empty: ReactNode
}

/** RN21: date, home, score and away, from the newest to the oldest, as the API returned. */
export function MatchesTable({ matches, isUpdating, error, onRetry, empty }: MatchesTableProps) {
  return (
    <DataTable
      label="Histórico de partidas"
      columns={COLUMNS}
      rows={matches}
      rowKey={(match) => match.id}
      isUpdating={isUpdating}
      error={error}
      onRetry={onRetry}
      empty={empty}
    />
  )
}
