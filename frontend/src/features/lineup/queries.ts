import { useMutation, useQueryClient } from '@tanstack/react-query'

import { saveLineup } from '../../api/clubs'
import { lineupKeys } from '../../api/queryKeys'
import type { LineupRequest } from '../../api/types'

/**
 * The response replaces the cached lineup, so the screen shows the lineup returned by the API. A
 * refusal changes nothing in the API and keeps the choices on screen to be fixed.
 */
export function useSaveLineup(clubId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (lineup: LineupRequest) => saveLineup(clubId, lineup),
    onSuccess: (saved) => queryClient.setQueryData(lineupKeys.detail(String(clubId)), saved),
  })
}
