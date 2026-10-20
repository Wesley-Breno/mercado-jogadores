import { HandCoins, ShoppingCart } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Transaction } from '../../api/types'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { type Column, DataTable } from '../../components/ui/DataTable'
import { SignedMoney } from '../../components/ui/SignedMoney'
import { dateTimeParts, formatMoney } from '../../lib/format'

const COLUMNS: Column<Transaction>[] = [
  {
    key: 'created_at',
    header: 'Data e hora',
    cell: (transaction) => {
      const { date, time } = dateTimeParts(transaction.created_at)
      return (
        <span>
          {date} <span className="text-zinc-500">{time}</span>
        </span>
      )
    },
  },
  {
    key: 'type',
    header: 'Tipo',
    cell: (transaction) => (
      <Badge>
        {transaction.type === 'COMPRA' ? (
          <ShoppingCart aria-hidden className="size-3" />
        ) : (
          <HandCoins aria-hidden className="size-3" />
        )}
        {transaction.type === 'COMPRA' ? 'Compra' : 'Venda'}
      </Badge>
    ),
  },
  {
    key: 'player_name',
    header: 'Jogador',
    cell: (transaction) => (
      <span className="flex items-center gap-2">
        <Avatar name={transaction.player_name} seed={transaction.player_id} className="size-7" />
        <span className="font-medium text-zinc-950">{transaction.player_name}</span>
      </span>
    ),
  },
  { key: 'value', header: 'Valor', align: 'right', cell: (item) => formatMoney(item.value) },
  {
    key: 'fee',
    header: 'Taxa ou comissão',
    align: 'right',
    cell: (item) => formatMoney(item.fee),
  },
  { key: 'penalty', header: 'Multa', align: 'right', cell: (item) => formatMoney(item.penalty) },
  {
    key: 'profit',
    header: 'Lucro',
    align: 'right',
    cell: (item) =>
      item.profit === null ? (
        <span className="text-zinc-400">
          <span aria-hidden>–</span>
          <span className="sr-only">sem lucro</span>
        </span>
      ) : (
        <SignedMoney value={item.profit} />
      ),
  },
  {
    key: 'cash_change',
    header: 'Variação do caixa',
    align: 'right',
    cell: (item) => <SignedMoney value={item.cash_change} strong />,
  },
]

type TransactionsTableProps = {
  transactions: Transaction[] | undefined
  isUpdating: boolean
  error: Error | null
  errorTitle?: string
  onRetry?: () => void
  empty: ReactNode
}

/** RN17: the club history in the order of the API, with the cash change signed. */
export function TransactionsTable(props: TransactionsTableProps) {
  return (
    <DataTable
      label="Histórico de transações"
      columns={COLUMNS}
      rows={props.transactions}
      rowKey={(transaction) => transaction.id}
      isUpdating={props.isUpdating}
      error={props.error}
      errorTitle={props.errorTitle}
      onRetry={props.onRetry}
      empty={props.empty}
    />
  )
}
