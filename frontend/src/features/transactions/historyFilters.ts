import type { Transaction, TransactionFilters, TransactionType } from '../../api/types'

const POSITIVE_INTEGER = /^[1-9][0-9]*$/
const TYPES: TransactionType[] = ['COMPRA', 'VENDA']

/** `type` and `player_id` from the address, with the names of the API; invalid ones are left out. */
export function readHistoryFilters(params: URLSearchParams): TransactionFilters {
  const playerId = params.get('player_id')
  return {
    type: TYPES.find((type) => type === params.get('type')),
    player_id: playerId !== null && POSITIVE_INTEGER.test(playerId) ? Number(playerId) : undefined,
  }
}

/** Checked type boxes: no `type` means both. */
export function checkedTypes(filters: TransactionFilters): Record<TransactionType, boolean> {
  return {
    COMPRA: filters.type !== 'VENDA',
    VENDA: filters.type !== 'COMPRA',
  }
}

/** Unchecking one box leaves only the other; checking it back shows both again. */
export function toggleType(filters: TransactionFilters, type: TransactionType): TransactionFilters {
  const other = type === 'COMPRA' ? 'VENDA' : 'COMPRA'
  return { ...filters, type: checkedTypes(filters)[type] ? other : undefined }
}

export type HistoryPlayer = {
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
