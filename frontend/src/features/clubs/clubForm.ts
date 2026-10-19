import { z } from 'zod'

import type { ClubCreate } from '../../api/types'
import { normalizeSpaces } from '../../lib/text'

const NAME_LENGTH = 'Use de 3 a 60 caracteres.'

/**
 * Limits of each field (F2): name from 3 to 60 characters and an acronym of 3 letters, sent in
 * capitals. The word rules and the match between acronym and name stay with the API.
 */
export const clubCreateSchema = z.object({
  name: z
    .string()
    .transform(normalizeSpaces)
    .pipe(z.string().min(1, 'Informe o nome.').min(3, NAME_LENGTH).max(60, NAME_LENGTH)),
  acronym: z
    .string()
    .trim()
    .min(1, 'Informe a sigla.')
    .regex(/^\p{L}{3}$/u, 'Use 3 letras.')
    .transform((acronym) => acronym.toUpperCase()),
}) satisfies z.ZodType<ClubCreate>

export type ClubCreateFields = z.input<typeof clubCreateSchema>
