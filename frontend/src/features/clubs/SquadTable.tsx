import { HandCoins } from 'lucide-react'
import type { ReactNode } from 'react'

import type { SquadPlayer } from '../../api/types'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { type Column, DataTable } from '../../components/ui/DataTable'
import { dateTimeParts, formatInteger, formatMoney } from '../../lib/format'
import { PLAYER_COLUMNS } from '../players/playerColumns'
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

function squadColumns(onSell: (player: SquadPlayer) => void): Column<SquadPlayer>[] {
  return [
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
    PLAYER_COLUMNS.position,
    PLAYER_COLUMNS.overall,
    PLAYER_COLUMNS.condition,
    PLAYER_COLUMNS.marketValue,
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
    {
      key: 'sell',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      cell: (player) => (
        <Button size="sm" onClick={() => onSell(player)} aria-label={`Vender ${player.name}`}>
          <HandCoins aria-hidden />
          Vender
        </Button>
      ),
    },
  ]
}

type SquadTableProps = {
  players: SquadPlayer[] | undefined
  onSell: (player: SquadPlayer) => void
  error: Error | null
  onRetry: () => void
  empty: ReactNode
}

/** The squad in the order of the API (RN11), with the contract columns. */
export function SquadTable({ players, onSell, error, onRetry, empty }: SquadTableProps) {
  return (
    <DataTable
      label="Elenco"
      columns={squadColumns(onSell)}
      rows={players}
      rowKey={(player) => player.id}
      error={error}
      onRetry={onRetry}
      empty={empty}
    />
  )
}
