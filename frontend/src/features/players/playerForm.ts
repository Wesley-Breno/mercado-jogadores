import type { DefaultValues } from 'react-hook-form'
import { z } from 'zod'

import type { PlayerCreate } from '../../api/types'
import { normalizeSpaces } from '../../lib/text'
import { POSITIONS } from './playerQuery'

/** The six technical attributes plus the potential, in the order of the form. */
export const INDICATORS = [
  { name: 'pace', label: 'Velocidade' },
  { name: 'shooting', label: 'Finalização' },
  { name: 'passing', label: 'Passe' },
  { name: 'dribbling', label: 'Drible' },
  { name: 'defending', label: 'Defesa' },
  { name: 'physical', label: 'Físico' },
  { name: 'potential', label: 'Potencial' },
] as const

const NAME_LENGTH = 'Use de 3 a 100 caracteres.'

/** A whole number typed in a text box, within the limits of a single field. */
function wholeNumber(min: number, max: number, missing: string, outOfRange: string) {
  return z
    .string()
    .trim()
    .min(1, missing)
    .regex(/^\d+$/, outOfRange)
    .transform(Number)
    .refine((value) => value >= min && value <= max, outOfRange)
}

function indicator(missing: string) {
  return wholeNumber(1, 99, missing, 'Use um valor de 1 a 99.')
}

/**
 * Limits of each field only (F2). Rules that cross fields, such as the sum of the attributes or the
 * potential against the age, stay with the API, and its `message` is shown in the form.
 */
export const playerCreateSchema = z.object({
  name: z
    .string()
    .transform(normalizeSpaces)
    .pipe(z.string().min(1, 'Informe o nome.').min(3, NAME_LENGTH).max(100, NAME_LENGTH)),
  position: z.enum(POSITIONS, { error: 'Escolha a posição.' }),
  age: wholeNumber(16, 45, 'Informe a idade.', 'Use uma idade de 16 a 45 anos.'),
  agility: wholeNumber(1, 100, 'Informe a agilidade.', 'Use um valor de 1 a 100.'),
  pace: indicator('Informe a velocidade.'),
  shooting: indicator('Informe a finalização.'),
  passing: indicator('Informe o passe.'),
  dribbling: indicator('Informe o drible.'),
  defending: indicator('Informe a defesa.'),
  physical: indicator('Informe o físico.'),
  potential: indicator('Informe o potencial.'),
}) satisfies z.ZodType<PlayerCreate>

export type PlayerCreateFields = z.input<typeof playerCreateSchema>

/** No position is chosen at first, so the form asks for one. */
export const EMPTY_PLAYER: DefaultValues<PlayerCreateFields> = {
  name: '',
  age: '',
  agility: '',
  pace: '',
  shooting: '',
  passing: '',
  dribbling: '',
  defending: '',
  physical: '',
  potential: '',
}
