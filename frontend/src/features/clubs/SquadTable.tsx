import type { ReactNode } from 'react'

import type { SquadPlayer } from '../../api/types'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { type Column, DataTable } from '../../components/ui/DataTable'
import { dateTimeParts, formatInteger, formatMoney } from '../../lib/format'
import { ConditionBadge } from '../players/PlayerBadges'
import { PenaltyBadge } from './PenaltyBadge'

function LoyaltyEnd({ value }: { value: string }) {
  const { date, time } = dateTimeParts(value)
  return (
    <span className="block leading-tight">
      {date}
      <span className="block text-xs text-zinc-500">{time}</span>
    </span>
  )
}

const COLUMNS: Column<SquadPlayer>[] = [
  {
    key: 'name',
    header: 'Jogador',
    cell: (player) => (
      <span className="flex items-center gap-3">
        <Avatar name={player.name} seed={player.id} />
        <span className="font-medium text-zinc-950">{player.name}</span>
      </span>
    ),
  },
  { key: 'position', header: 'Posição', cell: (player) => <Badge>{player.position}</Badge> },
  {
    key: 'overall',
    header: 'Overall',
    align: 'right',
    cell: (player) => <span className="font-semibold">{player.overall}</span>,
  },
  {
    key: 'condition',
    header: 'Condição',
    cell: (player) => <ConditionBadge condition={player.condition} />,
  },
  {
    key: 'market_value',
    header: 'Valor de mercado',
    align: 'right',
    cell: (player) => <span className="font-semibold">{formatMoney(player.market_value)}</span>,
  },
  {
    key: 'purchase_value',
    header: 'Valor de compra',
    align: 'right',
    cell: (player) => (
      <span className="text-zinc-600">{formatMoney(player.contract.purchase_value)}</span>
    ),
  },
  {
    key: 'loyalty_until',
    header: 'Fim da fidelidade',
    cell: (player) => <LoyaltyEnd value={player.contract.loyalty_until} />,
  },
  {
    key: 'remaining_days',
    header: 'Dias restantes',
    align: 'right',
    cell: (player) => formatInteger(player.contract.remaining_days),
  },
  {
    key: 'penalty_rate',
    header: '% de multa',
    cell: (player) => <PenaltyBadge rate={player.contract.penalty_rate} />,
  },
]

type SquadTableProps = {
  players: SquadPlayer[] | undefined
  error: Error | null
  onRetry: () => void
  empty: ReactNode
}

/** F07: the squad in the order of the API (RN11) with the contract columns. */
export function SquadTable({ players, error, onRetry, empty }: SquadTableProps) {
  return (
    <DataTable
      label="Elenco"
      columns={COLUMNS}
      rows={players}
      rowKey={(player) => player.id}
      error={error}
      onRetry={onRetry}
      empty={empty}
    />
  )
}
