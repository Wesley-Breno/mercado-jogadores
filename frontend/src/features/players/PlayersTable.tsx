import { HeartPulse, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import type { Club, Player } from '../../api/types'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { type Column, DataTable } from '../../components/ui/DataTable'
import { RowActions } from '../../components/ui/RowActions'
import { formatMoney } from '../../lib/format'
import { POSITION_LABELS } from './labels'
import { AgilityMeter, ConditionBadge } from './PlayerBadges'

export type PlayerAction = {
  kind: 'edit' | 'condition' | 'delete'
  player: Player
}

type PlayersTableProps = {
  players: Player[] | undefined
  clubs: ReadonlyMap<number, Club>
  onAction: (action: PlayerAction) => void
  isUpdating: boolean
  error: Error | null
  onRetry: () => void
  empty: ReactNode
}

function ClubTag({ club, clubId }: { club: Club | undefined; clubId: number | null }) {
  if (clubId === null) {
    return <Badge tone="neutral">Livre</Badge>
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Badge>{club?.acronym ?? '···'}</Badge>
      <Link
        to={`/clubes/${clubId}`}
        className="underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-950"
      >
        {club?.name}
      </Link>
    </span>
  )
}

function playerColumns(
  clubs: ReadonlyMap<number, Club>,
  onAction: (action: PlayerAction) => void,
): Column<Player>[] {
  return [
    {
      key: 'name',
      header: 'Jogador',
      cell: (player) => (
        <span className="flex items-center gap-3">
          <Avatar name={player.name} seed={player.id} />
          <span>
            <span className="block font-medium text-zinc-950">{player.name}</span>
            <span className="block text-xs text-zinc-500">{POSITION_LABELS[player.position]}</span>
          </span>
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
      key: 'agility',
      header: 'Agilidade',
      cell: (player) => <AgilityMeter agility={player.agility} />,
    },
    { key: 'age', header: 'Idade', align: 'right', cell: (player) => player.age },
    {
      key: 'condition',
      header: 'Condição',
      cell: (player) => <ConditionBadge condition={player.condition} />,
    },
    {
      key: 'base_value',
      header: 'Valor base',
      align: 'right',
      cell: (player) => <span className="text-zinc-600">{formatMoney(player.base_value)}</span>,
    },
    {
      key: 'market_value',
      header: 'Valor de mercado',
      align: 'right',
      cell: (player) => <span className="font-semibold">{formatMoney(player.market_value)}</span>,
    },
    {
      key: 'club',
      header: 'Clube',
      cell: (player) => (
        <ClubTag
          clubId={player.club_id}
          club={player.club_id === null ? undefined : clubs.get(player.club_id)}
        />
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      cell: (player) => (
        <RowActions
          title={player.name}
          actions={[
            {
              label: 'Editar',
              icon: Pencil,
              onSelect: () => onAction({ kind: 'edit', player }),
            },
            {
              label: 'Alterar condição',
              icon: HeartPulse,
              onSelect: () => onAction({ kind: 'condition', player }),
            },
            {
              label: 'Excluir',
              icon: Trash2,
              danger: true,
              disabled: player.club_id !== null,
              note:
                player.club_id === null
                  ? 'Disponível porque o jogador está livre.'
                  : 'Só jogador livre pode ser excluído.',
              onSelect: () => onAction({ kind: 'delete', player }),
            },
          ]}
        />
      ),
    },
  ]
}

export function PlayersTable({
  players,
  clubs,
  onAction,
  isUpdating,
  error,
  onRetry,
  empty,
}: PlayersTableProps) {
  return (
    <DataTable
      label="Jogadores"
      columns={playerColumns(clubs, onAction)}
      rows={players}
      rowKey={(player) => player.id}
      isUpdating={isUpdating}
      error={error}
      onRetry={onRetry}
      empty={empty}
    />
  )
}
