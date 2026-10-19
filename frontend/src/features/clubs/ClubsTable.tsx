import type { ReactNode } from 'react'

import type { Club } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { type Column, DataTable } from '../../components/ui/DataTable'
import { formatMoney } from '../../lib/format'
import { ClubMark } from './ClubMark'

const COLUMNS: Column<Club>[] = [
  {
    key: 'name',
    header: 'Clube',
    cell: (club) => (
      <span className="flex items-center gap-3">
        <ClubMark acronym={club.acronym} />
        <span className="font-medium text-zinc-950">{club.name}</span>
      </span>
    ),
  },
  { key: 'acronym', header: 'Sigla', cell: (club) => <Badge>{club.acronym}</Badge> },
  { key: 'cash', header: 'Caixa', align: 'right', cell: (club) => formatMoney(club.cash) },
  {
    key: 'squad_value',
    header: 'Valor do elenco',
    align: 'right',
    cell: (club) => formatMoney(club.squad_value),
  },
  {
    key: 'net_worth',
    header: 'Patrimônio',
    align: 'right',
    cell: (club) => <span className="font-semibold">{formatMoney(club.net_worth)}</span>,
  },
]

type ClubsTableProps = {
  clubs: Club[] | undefined
  isUpdating: boolean
  error: Error | null
  onRetry: () => void
  empty: ReactNode
}

/** F05: name, acronym, cash, squad value and net worth, in the order the API returned. */
export function ClubsTable({ clubs, isUpdating, error, onRetry, empty }: ClubsTableProps) {
  return (
    <DataTable
      label="Clubes"
      columns={COLUMNS}
      rows={clubs}
      rowKey={(club) => club.id}
      isUpdating={isUpdating}
      error={error}
      onRetry={onRetry}
      empty={empty}
    />
  )
}
