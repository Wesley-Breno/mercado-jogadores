import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { transactionKeys } from '../../api/queryKeys'
import { listTransactions } from '../../api/transactions'
import type { TransactionFilters } from '../../api/types'

export function useTransactions(clubId: string, filters: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(clubId, filters),
    queryFn: () => listTransactions(clubId, filters),
    placeholderData: keepPreviousData,
  })
}
