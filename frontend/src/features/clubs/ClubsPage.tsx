import { ArrowUpDown, Shield } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { ChoiceMenu } from '../../components/ui/ChoiceMenu'
import { PageHeader } from '../../components/ui/PageHeader'
import { Popover } from '../../components/ui/Popover'
import { EmptyState } from '../../components/ui/States'
import { lowerFirst } from '../../lib/text'
import { ClubsTable } from './ClubsTable'
import { CreateClub } from './CreateClub'
import { CLUB_SORTS, CLUB_SORT_LABELS, MAX_CLUBS } from './labels'
import { useClubs } from './queries'

/** F05: the order chosen stays in the address (`/clubes?sort=net_worth_desc`). */
export function ClubsPage() {
  const [params, setParams] = useSearchParams()
  const sort = CLUB_SORTS.find((value) => value === params.get('sort')) ?? 'name'
  const clubs = useClubs(sort)
  const count = clubs.data?.length

  return (
    <>
      <PageHeader
        icon={Shield}
        title="Clubes"
        description="Cada clube começa com 300,00 em caixa e sem jogadores. A liga aceita no máximo 20 clubes."
        action={<CreateClub />}
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            {count === undefined ? 'Clubes' : `${count} ${count === 1 ? 'clube' : 'clubes'}`}
            {count !== undefined && (
              <Badge tone="neutral">
                {count} de {MAX_CLUBS}
              </Badge>
            )}
          </p>
          <Popover
            icon={ArrowUpDown}
            label={`Ordenar: ${lowerFirst(CLUB_SORT_LABELS[sort])}`}
            align="end"
            popup="menu"
            panelLabel="Ordenar por"
          >
            {(close) => (
              <ChoiceMenu
                title="Ordenar por"
                choices={CLUB_SORTS.map((value) => ({ value, label: CLUB_SORT_LABELS[value] }))}
                selected={sort}
                onSelect={(value) => {
                  close()
                  setParams({ sort: value })
                }}
              />
            )}
          </Popover>
        </div>
        <ClubsTable
          clubs={clubs.data}
          isUpdating={clubs.isPlaceholderData}
          error={clubs.error}
          onRetry={() => clubs.refetch()}
          empty={
            <EmptyState
              icon={Shield}
              title="Nenhum clube cadastrado"
              description="Crie o primeiro clube com nome e sigla. Ele começa com 300,00 em caixa e sem jogadores."
              action={<CreateClub variant="outline" />}
            />
          }
        />
      </Card>
      <p className="mt-3 text-xs text-zinc-500">
        A ordem vem da API: pelo nome (padrão) ou pelo patrimônio, com empate desfeito pelo nome.
      </p>
    </>
  )
}
