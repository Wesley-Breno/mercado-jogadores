import { ArrowUpDown, SearchX, Users } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { toSearchParams } from '../../api/searchParams'
import type { PlayerQuery } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ChoiceButton } from '../../components/ui/ChoiceMenu'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { EmptyState } from '../../components/ui/States'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { lowerFirst } from '../../lib/text'
import { useClubs } from '../clubs/queries'
import { BuyPlayer } from '../market/BuyPlayer'
import { ConditionDialog } from './ConditionDialog'
import { CreatePlayer } from './CreatePlayer'
import { DeletePlayerDialog } from './DeletePlayerDialog'
import { COMBINATION_NOTE, SORT_LABELS } from './labels'
import { PlayerDetails } from './PlayerDetails'
import { PlayerEditDialog } from './PlayerEditDialog'
import { PlayerFilters } from './PlayerFilters'
import {
  type Availability,
  CLEARED_FILTERS,
  SORTS,
  activeFilters,
  availabilityOf,
  changeQuery,
  freeFilter,
  readPlayerQuery,
  toRequest,
} from './playerQuery'
import { type PlayerAction, PlayersTable } from './PlayersTable'
import { useAvailabilityCounts, usePlayers } from './queries'

const SEARCH_DELAY_MS = 350

const AVAILABILITY_LABELS: Record<Availability, string> = {
  all: 'Todos',
  free: 'Livres',
  owned: 'Em clubes',
}

/** RN07: the filters live in the address, so going back and reloading keep them. */
export function PlayersPage() {
  const [params, setParams] = useSearchParams()
  const query = readPlayerQuery(params)
  const debouncedSearch = useDebouncedValue(query.search, SEARCH_DELAY_MS)
  const request = toRequest({ ...query, search: query.search && debouncedSearch })
  const players = usePlayers(request)
  const clubs = useClubs()
  const clubsById = new Map((clubs.data ?? []).map((club) => [club.id, club]))
  const availability = availabilityOf(query)
  const counts = useAvailabilityCounts(request, availability, players.data?.meta.total_items)
  const active = activeFilters(query, clubsById)
  const sort = request.sort ?? 'name'
  const [action, setAction] = useState<PlayerAction | null>(null)

  function update(changes: PlayerQuery, options?: { replace: boolean }) {
    setParams(toSearchParams(changeQuery(query, changes)), options)
  }

  function emptyState() {
    if (players.data && players.data.meta.total_items > 0) {
      return (
        <EmptyState
          icon={Users}
          title="Esta página não tem jogadores"
          description="A lista mudou e ficou com menos páginas."
          action={<Button onClick={() => update({})}>Ir para a primeira página</Button>}
        />
      )
    }
    if (active.length > 0 || availability !== 'all') {
      return (
        <EmptyState
          icon={SearchX}
          title="Nenhum jogador encontrado"
          description="Nenhum jogador atende à busca e aos filtros escolhidos."
          action={
            active.length > 0 && (
              <Button onClick={() => update(CLEARED_FILTERS)}>Limpar filtros</Button>
            )
          }
        />
      )
    }
    return (
      <EmptyState
        icon={Users}
        title="Nenhum jogador cadastrado"
        description="Os jogadores cadastrados aparecem aqui, com overall e valor de mercado."
      />
    )
  }

  return (
    <>
      <PageHeader
        icon={Users}
        title="Jogadores"
        description="Cadastre jogadores, acompanhe os indicadores e compre os que estão livres."
        action={<CreatePlayer onShowDetails={(player) => setAction({ kind: 'details', player })} />}
      />
      <PlayerFilters query={query} clubs={clubs.data ?? []} active={active} onChange={update} />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <SegmentedControl
            label="Mostrar"
            selected={availability}
            onSelect={(value) => update({ free: freeFilter(value) })}
            segments={(['all', 'free', 'owned'] as const).map((value) => {
              const blocked = value === 'free' && query.club_id !== undefined
              return {
                value,
                label: AVAILABILITY_LABELS[value],
                count: blocked ? undefined : counts[value],
                disabled: blocked,
                title: blocked ? COMBINATION_NOTE : undefined,
              }
            })}
          />
          <ChoiceButton
            icon={ArrowUpDown}
            label={`Ordenar: ${lowerFirst(SORT_LABELS[sort])}`}
            align="end"
            title="Ordenar por"
            choices={SORTS.map((value) => ({ value, label: SORT_LABELS[value] }))}
            selected={sort}
            onSelect={(value) => update({ sort: value })}
          />
        </div>
        <PlayersTable
          players={players.data?.data}
          clubs={clubsById}
          onAction={setAction}
          isUpdating={players.isPlaceholderData}
          error={players.error}
          onRetry={() => players.refetch()}
          empty={emptyState()}
        />
        {players.data && players.data.data.length > 0 && (
          <Pagination
            page={players.data.meta.page}
            limit={players.data.meta.limit}
            totalItems={players.data.meta.total_items}
            totalPages={players.data.meta.total_pages}
            itemLabel={{ one: 'jogador', other: 'jogadores' }}
            onPageChange={(page) => update({ page })}
          />
        )}
      </Card>
      <p className="mt-3 text-xs text-zinc-500">
        Overall e valor de mercado são calculados pela API a cada consulta. A busca ignora
        maiúsculas, minúsculas e acentos.
      </p>
      {action?.kind === 'details' && (
        <PlayerDetails
          player={action.player}
          club={action.player.club_id === null ? undefined : clubsById.get(action.player.club_id)}
          onClose={() => setAction(null)}
          onAction={(kind) => setAction({ kind, player: action.player })}
        />
      )}
      {action?.kind === 'edit' && (
        <PlayerEditDialog player={action.player} onClose={() => setAction(null)} />
      )}
      {action?.kind === 'condition' && (
        <ConditionDialog player={action.player} onClose={() => setAction(null)} />
      )}
      {action?.kind === 'buy' && (
        <BuyPlayer player={action.player} onClose={() => setAction(null)} />
      )}
      {action?.kind === 'delete' && (
        <DeletePlayerDialog player={action.player} onClose={() => setAction(null)} />
      )}
    </>
  )
}
