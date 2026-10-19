import { Shirt, Users } from 'lucide-react'

import type { ClubDetail, SquadPlayer } from '../../api/types'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/States'
import { SquadTable } from './SquadTable'

type SquadSectionProps = {
  club: ClubDetail | undefined
  error: Error | null
  onRetry: () => void
  onSell: (player: SquadPlayer) => void
}

/** The "Elenco" tab: the squad with the contract columns and the note on what the API calculates. */
export function SquadSection({ club, error, onRetry, onSell }: SquadSectionProps) {
  return (
    <>
      <Card>
        <div className="px-4 py-3">
          <h2 className="font-semibold">Elenco</h2>
          <p className="text-xs text-zinc-500">
            Ordem por posição (GOL, ZAG, LAT, MEI, ATA), depois pelo nome. Contrato calculado para
            uma venda agora.
          </p>
        </div>
        <SquadTable
          players={club?.players}
          onSell={onSell}
          error={error}
          onRetry={onRetry}
          empty={
            <EmptyState
              icon={Shirt}
              title="Nenhum jogador no elenco"
              description="Compre jogadores livres para montar o elenco. O limite é de 12 jogadores, e o custo de cada compra não pode passar de 50% do caixa."
              action={
                <ButtonLink to="/jogadores?free=true">
                  <Users aria-hidden />
                  Ver jogadores livres
                </ButtonLink>
              }
            />
          }
        />
      </Card>
      <p className="mt-3 text-xs text-zinc-500">
        Valor de mercado, dias restantes e % de multa calculados pela API para uma venda agora. A
        multa tem teto de 10,00.
      </p>
    </>
  )
}
