import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createClub, listClubs } from '../../api/clubs'
import type { ClubSort } from '../../api/types'

export const clubKeys = {
  all: ['clubs'] as const,
  list: (sort: ClubSort) => [...clubKeys.all, 'list', sort] as const,
}

/** The order always goes in the request, so the screen shows the clubs as the API sorted them. */
export function useClubs(sort: ClubSort = 'name') {
  return useQuery({
    queryKey: clubKeys.list(sort),
    queryFn: () => listClubs(sort),
    placeholderData: keepPreviousData,
  })
}

export function useCreateClub() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createClub,
    onSettled: () => queryClient.invalidateQueries({ queryKey: clubKeys.all }),
  })
}
