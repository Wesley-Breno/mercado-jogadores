import type { Player } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import type { Column } from '../../components/ui/DataTable'
import { formatMoney } from '../../lib/format'
import { ConditionBadge } from './PlayerBadges'

/** Columns that the players list and the club squad show the same way. */
export const PLAYER_COLUMNS = {
  position: {
    key: 'position',
    header: 'Posição',
    cell: (player) => <Badge>{player.position}</Badge>,
  },
  overall: {
    key: 'overall',
    header: 'Overall',
    align: 'right',
    cell: (player) => <span className="font-semibold">{player.overall}</span>,
  },
  condition: {
    key: 'condition',
    header: 'Condição',
    cell: (player) => <ConditionBadge condition={player.condition} />,
  },
  marketValue: {
    key: 'market_value',
    header: 'Valor de mercado',
    align: 'right',
    cell: (player) => <span className="font-semibold">{formatMoney(player.market_value)}</span>,
  },
} satisfies Record<string, Column<Player>>
