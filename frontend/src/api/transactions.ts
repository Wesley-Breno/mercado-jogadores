import { apiGet } from './client'
import { toSearchParams } from './searchParams'
import type { TransactionFilters, TransactionHistory } from './types'

function historyPath(clubId: string): string {
  return `/clubs/${encodeURIComponent(clubId)}/transactions`
}

export function listTransactions(
  clubId: string,
  filters: TransactionFilters,
): Promise<TransactionHistory> {
  return apiGet<TransactionHistory>(`${historyPath(clubId)}${toSearchParams(filters)}`)
}
