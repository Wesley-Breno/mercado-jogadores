import {
  ClipboardList,
  Coins,
  History,
  Landmark,
  SearchX,
  Shirt,
  ShoppingCart,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'

import { ApiError } from '../../api/client'
import type { ClubDetail, SquadPlayer } from '../../api/types'
import { useBreadcrumbTail } from '../../app/breadcrumbContext'
import { Badge } from '../../components/ui/Badge'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { Tabs } from '../../components/ui/Tabs'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { formatMoney } from '../../lib/format'
import { LineupSection } from '../lineup/LineupSection'
import { SellPlayer } from '../market/SellPlayer'
import { useTransactions } from '../transactions/queries'
import { TransactionHistory } from '../transactions/TransactionHistory'
import { ClubMark } from './ClubMark'
import { MAX_SQUAD } from './labels'
import { useClub } from './queries'
import { SquadSection } from './SquadSection'

type ClubTab = 'elenco' | 'escalacao' | 'historico'

const CLUB_TABS: ClubTab[] = ['elenco', 'escalacao', 'historico']

function ClubHeader({ club }: { club: ClubDetail | undefined }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <ClubMark acronym={club?.acronym ?? '···'} large />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{club?.name ?? 'Carregando…'}</h1>
          {club && (
            <p className="mt-1 flex flex-wrap gap-1.5">
              <Badge>Sigla {club.acronym}</Badge>
              <Badge>
                <Shirt aria-hidden className="size-3" />
                {club.players.length} de {MAX_SQUAD} jogadores
              </Badge>
            </p>
          )}
        </div>
      </div>
      <ButtonLink to="/jogadores?free=true" variant="primary">
        <ShoppingCart aria-hidden />
        Comprar jogadores
      </ButtonLink>
    </header>
  )
}

function ClubStats({ club }: { club: ClubDetail | undefined }) {
  if (!club) {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className="h-28 animate-pulse rounded-xl bg-zinc-100" />
        ))}
      </div>
    )
  }
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Caixa"
        icon={Wallet}
        value={formatMoney(club.cash)}
        unit="moedas"
        hint="Só muda por compras e vendas"
      />
      <StatCard
        label="Valor do elenco"
        icon={Coins}
        value={formatMoney(club.squad_value)}
        unit="moedas"
        hint="Soma dos valores de mercado"
      />
      <StatCard
        label="Patrimônio"
        icon={Landmark}
        value={formatMoney(club.net_worth)}
        unit="moedas"
        hint="Caixa + valor do elenco"
      />
      <StatCard
        label="Elenco"
        icon={Shirt}
        value={`${club.players.length} de ${MAX_SQUAD}`}
        hint={`Limite de ${MAX_SQUAD} jogadores`}
      />
    </div>
  )
}

/** F07: cash, squad value and net worth from GET /clubs/{id}, and the squad with contracts. */
export function ClubPage() {
  const { clubId = '' } = useParams()
  const club = useClub(clubId)
  const history = useTransactions(clubId, {})
  const [params, setParams] = useSearchParams()
  const tab = CLUB_TABS.find((value) => value === params.get('aba')) ?? 'elenco'
  const [selling, setSelling] = useState<SquadPlayer | null>(null)
  useBreadcrumbTail(club.data?.name)

  /** The tab goes in the address (`?aba=historico`); changing it clears the history filters. */
  function showTab(next: ClubTab) {
    setParams(next === 'elenco' ? {} : { aba: next })
  }

  if (club.error instanceof ApiError && club.error.status === 404) {
    return (
      <Card>
        <EmptyState
          icon={SearchX}
          title="Clube não encontrado"
          description="O clube não existe ou o endereço está errado."
          action={<ButtonLink to="/clubes">Ver clubes</ButtonLink>}
        />
      </Card>
    )
  }

  if (club.error && !club.data) {
    return (
      <Card>
        <ErrorState message={club.error.message} onRetry={() => club.refetch()} />
      </Card>
    )
  }

  return (
    <>
      <ClubHeader club={club.data} />
      <ClubStats club={club.data} />
      <Tabs
        label="Seções do clube"
        tabs={[
          { key: 'elenco', label: 'Elenco', icon: Shirt, count: club.data?.players.length },
          { key: 'escalacao', label: 'Escalação', icon: ClipboardList },
          {
            key: 'historico',
            label: 'Histórico',
            icon: History,
            count: history.data?.data.length,
          },
        ]}
        selected={tab}
        onSelect={showTab}
      >
        {tab === 'elenco' && (
          <SquadSection
            club={club.data}
            error={club.error}
            onRetry={() => club.refetch()}
            onSell={setSelling}
          />
        )}
        {tab === 'escalacao' && club.data && <LineupSection club={club.data} />}
        {tab === 'historico' && <TransactionHistory clubId={clubId} />}
      </Tabs>
      {selling && club.data && (
        <SellPlayer
          player={selling}
          clubName={club.data.name}
          onClose={() => setSelling(null)}
          onShowHistory={() => {
            setSelling(null)
            showTab('historico')
          }}
        />
      )}
    </>
  )
}
