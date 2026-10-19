import { useQuery } from '@tanstack/react-query'

import { listClubs } from '../../api/clubs'

export function useClubs() {
  return useQuery({ queryKey: ['clubs', 'list'], queryFn: listClubs })
}
