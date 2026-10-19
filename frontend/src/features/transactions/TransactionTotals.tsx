import {
  type LucideIcon,
  BadgePercent,
  HandCoins,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import type { ReactNode } from 'react'

import type { TransactionSummary } from '../../api/types'
import { SignedMoney } from '../../components/ui/SignedMoney'
import { formatMoney } from '../../lib/format'

type Total = {
  label: string
  icon: LucideIcon
  value: ReactNode
  hint: string
}

/** F10: the `summary` of the API below the table, for the same filters as the table. */
export function TransactionTotals({ summary }: { summary: TransactionSummary }) {
  const totals: Total[] = [
    {
      label: 'Total pago em compras',
      icon: ShoppingCart,
      value: formatMoney(summary.total_spent),
      hint: 'Valor + taxa',
    },
    {
      label: 'Total recebido em vendas',
      icon: HandCoins,
      value: formatMoney(summary.total_received),
      hint: 'Crédito líquido',
    },
    {
      label: 'Taxas e comissões',
      icon: BadgePercent,
      value: formatMoney(summary.total_fees),
      hint: 'Somadas',
    },
    {
      label: 'Multas',
      icon: TriangleAlert,
      value: formatMoney(summary.total_penalties),
      hint: 'Por fidelidade',
    },
    {
      label: 'Lucro total',
      icon: TrendingUp,
      value: <SignedMoney value={summary.total_profit} />,
      hint: 'Soma dos lucros, com sinal',
    },
  ]
  return (
    <dl
      aria-label="Totais do histórico"
      className="grid grid-cols-2 gap-px border-t border-zinc-200 bg-zinc-200 sm:grid-cols-3 lg:grid-cols-5"
    >
      {totals.map(({ label, icon: Icon, value, hint }) => (
        <div key={label} className="bg-zinc-50 px-4 py-3 last:col-span-2 lg:last:col-span-1">
          <dt className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Icon aria-hidden className="size-3.5" />
            {label}
          </dt>
          <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
          <dd className="text-xs text-zinc-500">{hint}</dd>
        </div>
      ))}
    </dl>
  )
}
