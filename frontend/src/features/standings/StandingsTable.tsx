import { Shield } from 'lucide-react'
import { Link } from 'react-router'

import type { Club, StandingRow } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { type Column, DataTable } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/States'
import { cn } from '../../lib/cn'
import { formatSignedInteger } from '../../lib/format'

type Stat = {
  key: 'played' | 'wins' | 'draws' | 'losses' | 'goals_for' | 'goals_against'
  short: string
  title: string
}

const STATS: Stat[] = [
  { key: 'played', short: 'J', title: 'Jogos' },
  { key: 'wins', short: 'V', title: 'Vitórias' },
  { key: 'draws', short: 'E', title: 'Empates' },
  { key: 'losses', short: 'D', title: 'Derrotas' },
  { key: 'goals_for', short: 'GP', title: 'Gols marcados' },
  { key: 'goals_against', short: 'GC', title: 'Gols sofridos' },
]

function standingColumns(clubs: ReadonlyMap<number, Club>): Column<StandingRow>[] {
  return [
    {
      key: 'position',
      header: '#',
      cell: (row) => (
        <span
          className={cn(
            'grid size-6 place-items-center rounded-md text-xs font-semibold',
            row.position === 1 ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-700',
          )}
        >
          {row.position}
        </span>
      ),
    },
    {
      key: 'club',
      header: 'Clube',
      cell: (row) => (
        <span className="inline-flex items-center gap-2">
          <Badge>{clubs.get(row.club_id)?.acronym ?? '···'}</Badge>
          <Link
            to={`/clubes/${row.club_id}`}
            className="font-medium underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-950"
          >
            {row.club_name}
          </Link>
        </span>
      ),
    },
    ...STATS.map(({ key, short, title }): Column<StandingRow> => ({
      key,
      header: <abbr title={title}>{short}</abbr>,
      align: 'right',
      cell: (row) => row[key],
    })),
    {
      key: 'goal_difference',
      header: <abbr title="Saldo de gols">SG</abbr>,
      align: 'right',
      cell: (row) => formatSignedInteger(row.goal_difference),
    },
    {
      key: 'points',
      header: <abbr title="Pontos">Pts</abbr>,
      align: 'right',
      cell: (row) => <span className="font-semibold">{row.points}</span>,
    },
  ]
}

type StandingsTableProps = {
  rows: StandingRow[] | undefined
  clubs: ReadonlyMap<number, Club>
  error: Error | null
  onRetry: () => void
}

/** RN21: every club, in the order returned by GET /standings, nothing sorted on screen. */
export function StandingsTable({ rows, clubs, error, onRetry }: StandingsTableProps) {
  return (
    <DataTable
      label="Classificação"
      columns={standingColumns(clubs)}
      rows={rows}
      rowKey={(row) => row.club_id}
      error={error}
      onRetry={onRetry}
      empty={
        <EmptyState
          icon={Shield}
          title="Nenhum clube na liga"
          description="A classificação mostra todos os clubes, com ou sem partidas. Crie um clube para começar."
        />
      }
    />
  )
}
