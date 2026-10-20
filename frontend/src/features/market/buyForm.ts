import { z } from 'zod'

import type { BuyRequest } from '../../api/types'
import { isRealDate, isRealTime, toLocalDateTime } from '../../lib/dateInput'
import { toApiDateTime } from '../../lib/format'

/**
 * The club and the end of loyalty, typed in Brasília time and sent with -03:00 (RN01). The
 * window "after now and up to 1.095 days" depends on the moment, so the API checks it.
 */
export const buySchema = z
  .object({
    club_id: z.string().min(1, 'Escolha o clube comprador.'),
    date: z
      .string()
      .trim()
      .min(1, 'Informe a data.')
      .refine(isRealDate, 'Use uma data do calendário, como 12/11/2027.'),
    time: z
      .string()
      .trim()
      .min(1, 'Informe a hora.')
      .refine(isRealTime, 'Use uma hora de 00:00 a 23:59.'),
  })
  .transform(({ club_id, date, time }): BuyRequest => ({
    club_id: Number(club_id),
    loyalty_until: toApiDateTime(toLocalDateTime(date, time)),
  }))

export type BuyFields = z.input<typeof buySchema>
