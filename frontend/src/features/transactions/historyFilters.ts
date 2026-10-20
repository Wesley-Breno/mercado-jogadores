import type { Transaction, TransactionFilters, TransactionType } from '../../api/types'

const POSITIVE_INTEGER = /^[1-9][0-9]*$/
export const TYPES: TransactionType[] = ['COMPRA', 'VENDA']

/**
 * `type` and `player_id` from the address, with the names of the API; invalid ones are left out.
 * Without `type` in the address both boxes are checked, and the request still names both types.
 */
export function readHistoryFilters(params: URLSearchParams): TransactionFilters {
  const playerId = params.get('player_id')
  const named = params.get('type')?.split(',') ?? []
  const types = TYPES.filter((type) => named.includes(type))
  return {
    type: types.length > 0 ? types : TYPES,
    player_id: playerId !== null && POSITIVE_INTEGER.test(playerId) ? Number(playerId) : undefined,
  }
}

/** The address keeps `type` only while one box is unchecked. */
export function typeParam(filters: TransactionFilters): string | undefined {
  return filters.type && filters.type.length < TYPES.length ? filters.type.join(',') : undefined
}

export function checkedTypes(filters: TransactionFilters): Record<TransactionType, boolean> {
  const checked = filters.type ?? TYPES
  return { COMPRA: checked.includes('COMPRA'), VENDA: checked.includes('VENDA') }
}

/** Unchecking one box leaves only the other; the last checked box cannot be unchecked. */
export function toggleType(filters: TransactionFilters, type: TransactionType): TransactionFilters {
  const checked = checkedTypes(filters)
  const next = TYPES.filter((each) => (each === type ? !checked[each] : checked[each]))
  return next.length > 0 ? { ...filters, type: next } : filters
}

type HistoryPlayer = {
  id: number
  name: string
}

/** The players that appear in the club history, with the most recent name, in name order. */
export function playersInHistory(transactions: Transaction[]): HistoryPlayer[] {
  const names = new Map<number, string>()
  for (const transaction of transactions) {
    if (!names.has(transaction.player_id)) {
      names.set(transaction.player_id, transaction.player_name)
    }
  }
  return [...names]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}
