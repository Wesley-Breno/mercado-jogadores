import { BarChart3, Coins, HeartPulse, Pencil, ShoppingCart, Tag, TrendingUp } from 'lucide-react'

import type { Club, Player } from '../../api/types'
import { AttributeBars } from '../../components/ui/AttributeBars'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { ResultList } from '../../components/ui/ResultList'
import { StatCard } from '../../components/ui/StatCard'
import { formatMoney } from '../../lib/format'
import { ConditionBadge } from './PlayerBadges'
import { ATTRIBUTES } from './playerForm'
import type { PlayerAction } from './PlayersTable'

type PlayerDetailsProps = {
  player: Player
  club: Club | undefined
  onClose: () => void
  onAction: (kind: Exclude<PlayerAction['kind'], 'details' | 'delete'>) => void
}

/** J12: everything the API returned for the player, on a side panel, with his actions. */
export function PlayerDetails({ player, club, onClose, onAction }: PlayerDetailsProps) {
  const isFree = player.club_id === null
  return (
    <Dialog
      placement="side"
      title={player.name}
      description={
        <span className="flex flex-wrap gap-1.5">
          <Badge>{player.position}</Badge>
          <ConditionBadge condition={player.condition} />
          <Badge tone="neutral">{isFree ? 'Livre' : (club?.acronym ?? 'Com clube')}</Badge>
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <Button onClick={() => onAction('edit')}>
            <Pencil aria-hidden />
            Editar
          </Button>
          <Button onClick={() => onAction('condition')} className="mr-auto">
            <HeartPulse aria-hidden />
            Alterar condição
          </Button>
          {isFree && (
            <Button variant="primary" onClick={() => onAction('buy')}>
              <ShoppingCart aria-hidden />
              Comprar
            </Button>
          )}
        </>
      }
    >
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Valor de mercado"
            icon={Coins}
            value={formatMoney(player.market_value)}
            hint="Calculado a cada consulta"
          />
          <StatCard
            label="Valor base"
            icon={Tag}
            value={formatMoney(player.base_value)}
            hint="Calculado no cadastro"
          />
          <StatCard
            label="Overall"
            icon={BarChart3}
            value={String(player.overall)}
            hint="Calculado pela posição"
          />
          <StatCard
            label="Potencial"
            icon={TrendingUp}
            value={String(player.potential)}
            hint="Informado no cadastro"
          />
        </div>
        <section aria-label="Indicadores técnicos" className="grid gap-3">
          <h3 className="flex items-center justify-between text-sm font-semibold">
            Indicadores técnicos
            <span className="text-xs font-normal text-zinc-500">Escala de 1 a 99</span>
          </h3>
          <AttributeBars
            attributes={ATTRIBUTES.map(({ name, label }) => ({ label, value: player[name] }))}
            potential={player.potential}
          />
        </section>
        <ResultList
          items={[
            { label: 'Idade', value: `${player.age} anos` },
            { label: 'Agilidade', value: player.agility },
            { label: 'Clube', value: isFree ? 'Livre' : (club?.name ?? '–') },
          ]}
        />
      </div>
    </Dialog>
  )
}
