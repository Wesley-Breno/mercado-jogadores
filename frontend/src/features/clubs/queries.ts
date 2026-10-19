import { useQuery } from '@tanstack/react-query'

import { listClubs } from '../../api/clubs'

export const clubKeys = {
  all: ['clubs'] as const,
  list: () => [...clubKeys.all, 'list'] as const,
}

export function useClubs() {
  return useQuery({ queryKey: clubKeys.list(), queryFn: listClubs })
}
