import { useQuery } from '@tanstack/react-query'

import { standingsKeys } from '../../api/queryKeys'
import { getStandings } from '../../api/standings'

export function useStandings() {
  return useQuery({ queryKey: standingsKeys.all, queryFn: getStandings })
}
