import { apiDownload, apiGet } from './client'
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

/** RN18: the CSV with the same filters as the history; refusals still come as JSON. */
export function exportTransactions(clubId: string, filters: TransactionFilters): Promise<Blob> {
  return apiDownload(`${historyPath(clubId)}/export${toSearchParams(filters)}`)
}
