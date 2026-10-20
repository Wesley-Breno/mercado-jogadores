import { Eye, HeartPulse, Pencil, ShoppingCart, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import type { Club, Player } from '../../api/types'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { type Column, DataTable } from '../../components/ui/DataTable'
import { RowActions } from '../../components/ui/RowActions'
import { formatMoney } from '../../lib/format'
import { POSITION_LABELS } from './labels'
import { AgilityMeter } from './PlayerBadges'
import { PLAYER_COLUMNS } from './playerColumns'

export type PlayerAction = {
  kind: 'details' | 'edit' | 'condition' | 'delete' | 'buy'
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

type ClubCellProps = {
  player: Player
  club: Club | undefined
  onBuy: () => void
}

/** Club name and acronym, or "Livre" with the button that starts the purchase (F06). */
function ClubCell({ player, club, onBuy }: ClubCellProps) {
  if (player.club_id === null) {
    return (
      <span className="inline-flex items-center gap-2">
        <Badge tone="neutral">Livre</Badge>
        <Button size="sm" onClick={onBuy} aria-label={`Comprar ${player.name}`}>
          <ShoppingCart aria-hidden />
          Comprar
        </Button>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Badge>{club?.acronym ?? '···'}</Badge>
      <Link
        to={`/clubes/${player.club_id}`}
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
    PLAYER_COLUMNS.position,
    PLAYER_COLUMNS.overall,
    {
      key: 'agility',
      header: 'Agilidade',
      cell: (player) => <AgilityMeter agility={player.agility} />,
    },
    { key: 'age', header: 'Idade', align: 'right', cell: (player) => player.age },
    PLAYER_COLUMNS.condition,
    {
      key: 'base_value',
      header: 'Valor base',
      align: 'right',
      cell: (player) => <span className="text-zinc-600">{formatMoney(player.base_value)}</span>,
    },
    PLAYER_COLUMNS.marketValue,
    {
      key: 'club',
      header: 'Clube',
      cell: (player) => (
        <ClubCell
          player={player}
          club={player.club_id === null ? undefined : clubs.get(player.club_id)}
          onBuy={() => onAction({ kind: 'buy', player })}
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
              label: 'Ver detalhes',
              icon: Eye,
              onSelect: () => onAction({ kind: 'details', player }),
            },
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
            ...(player.club_id === null
              ? [
                  {
                    label: 'Comprar',
                    icon: ShoppingCart,
                    onSelect: () => onAction({ kind: 'buy', player }),
                  },
                ]
              : []),
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
