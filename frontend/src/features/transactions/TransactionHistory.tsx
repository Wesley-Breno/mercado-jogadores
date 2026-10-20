import { History, User } from 'lucide-react'
import { useSearchParams } from 'react-router'

import type { TransactionFilters, TransactionType } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { Select } from '../../components/ui/Field'
import { EmptyState } from '../../components/ui/States'
import { cn } from '../../lib/cn'
import { ExportCsvButton } from './ExportCsvButton'
import {
  checkedTypes,
  playersInHistory,
  readHistoryFilters,
  toggleType,
  typeParam,
} from './historyFilters'
import { useTransactions } from './queries'
import { TransactionsTable } from './TransactionsTable'
import { TransactionTotals } from './TransactionTotals'

const TYPE_LABELS: Record<TransactionType, string> = { COMPRA: 'Compra', VENDA: 'Venda' }

/**
 * RN17 and RN18: the history of the club with the filters by type and by player, kept in the address,
 * and the CSV with the same filters. A refused filter (a deleted player, for example) shows the
 * `message` of the API.
 */
export function TransactionHistory({ clubId }: { clubId: string }) {
  const [params, setParams] = useSearchParams()
  const filters = readHistoryFilters(params)
  const history = useTransactions(clubId, filters)
  const everything = useTransactions(clubId, {})
  const players = playersInHistory(everything.data?.data ?? [])
  const checked = checkedTypes(filters)
  const isFiltered = typeParam(filters) !== undefined || filters.player_id !== undefined

  function isOnlyType(type: TransactionType): boolean {
    return checked[type] && typeParam(filters) !== undefined
  }

  function update(changes: TransactionFilters) {
    const next = { ...filters, ...changes }
    const changed = new URLSearchParams(params)
    const values = { type: typeParam(next), player_id: next.player_id?.toString() }
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) {
        changed.delete(key)
      } else {
        changed.set(key, value)
      }
    }
    setParams(changed, { replace: true })
  }

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-3">
          <div>
            <h2 className="font-semibold">Histórico de transações</h2>
            <p className="text-xs text-zinc-500">
              Da mais recente para a mais antiga, com o nome e os valores do momento de cada
              operação.
            </p>
          </div>
          <ExportCsvButton
            clubId={clubId}
            filters={filters}
            playerName={players.find((player) => player.id === filters.player_id)?.name}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
          <span className="text-zinc-500">Tipo</span>
          {(['COMPRA', 'VENDA'] as const).map((type) => (
            <label
              key={type}
              className={cn(
                'inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 font-medium shadow-xs has-disabled:cursor-not-allowed has-focus-visible:ring-3 has-focus-visible:ring-blue-600/30',
                checked[type]
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-zinc-200 bg-white text-zinc-700',
              )}
            >
              <input
                type="checkbox"
                checked={checked[type]}
                disabled={isOnlyType(type)}
                title={isOnlyType(type) ? 'Fica pelo menos um tipo marcado.' : undefined}
                onChange={() => update(toggleType(filters, type))}
                className="accent-blue-600"
              />
              {TYPE_LABELS[type]}
            </label>
          ))}
          <label className="w-56">
            <span className="sr-only">Jogador</span>
            <Select
              icon={User}
              value={filters.player_id ?? ''}
              onChange={(event) =>
                update({
                  player_id: event.target.value ? Number(event.target.value) : undefined,
                })
              }
            >
              <option value="">Jogador: todos</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </Select>
          </label>
          {isFiltered && (
            <button
              type="button"
              onClick={() => update({ type: undefined, player_id: undefined })}
              className="font-medium text-blue-600 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <TransactionsTable
          transactions={history.data?.data}
          isUpdating={history.isPlaceholderData}
          error={history.error}
          errorTitle={isFiltered ? 'O filtro foi recusado' : undefined}
          onRetry={isFiltered ? undefined : () => history.refetch()}
          empty={
            <EmptyState
              icon={History}
              title="Nenhuma transação"
              description={
                isFiltered
                  ? 'Nenhuma transação atende aos filtros escolhidos.'
                  : 'As compras e as vendas do clube aparecem aqui, da mais recente para a mais antiga.'
              }
            />
          }
        />
        {history.data && !history.error && <TransactionTotals summary={history.data.summary} />}
      </Card>
      <p className="mt-3 text-xs text-zinc-500">
        Os totais vêm da API e respeitam os filtros: 300,00 + a soma das variações dá o caixa atual.
      </p>
    </>
  )
}
