import { z } from 'zod'

import type { MatchRequest } from '../../api/types'

/** F2: both clubs are required; the same club on both sides is also refused by the API (400). */
export const matchSchema = z
  .object({
    home_club_id: z.string().min(1, 'Escolha o mandante.'),
    away_club_id: z.string().min(1, 'Escolha o visitante.'),
  })
  .refine((match) => match.home_club_id !== match.away_club_id, {
    path: ['away_club_id'],
    message: 'Escolha um clube diferente do mandante.',
  })
  .transform((match): MatchRequest => ({
    home_club_id: Number(match.home_club_id),
    away_club_id: Number(match.away_club_id),
  }))

export type MatchFields = z.input<typeof matchSchema>
