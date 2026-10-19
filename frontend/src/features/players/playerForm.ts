import type { DefaultValues } from 'react-hook-form'
import { z } from 'zod'

import type { Player, PlayerCreate, PlayerUpdate } from '../../api/types'
import { normalizeSpaces } from '../../lib/text'
import { CONDITIONS, POSITIONS } from './playerQuery'

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

/** The six attributes, without the potential, for the bars of the preview and of the details. */
export const ATTRIBUTES = INDICATORS.filter((indicator) => indicator.name !== 'potential')

const TYPED_INDICATOR = /^\d{1,2}$/

/** What the preview draws for a typed indicator: a value from 1 to 99, or nothing. */
export function typedIndicator(text: string | undefined): number | undefined {
  const trimmed = (text ?? '').trim()
  return TYPED_INDICATOR.test(trimmed) && Number(trimmed) >= 1 ? Number(trimmed) : undefined
}

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

/**
 * J09: only name, position, age and agility change. The age cannot go down, a refusal the screen
 * may prevent with the data it already has.
 */
export function playerEditSchema(current: Player) {
  return playerCreateSchema
    .pick({ name: true, position: true, age: true, agility: true })
    .refine((player) => player.age >= current.age, {
      path: ['age'],
      message: `A idade não pode diminuir (atual: ${current.age}).`,
    }) satisfies z.ZodType<PlayerUpdate>
}

export type PlayerEditFields = z.input<ReturnType<typeof playerEditSchema>>

export function editFieldsOf(player: Player): PlayerEditFields {
  return {
    name: player.name,
    position: player.position,
    age: String(player.age),
    agility: String(player.agility),
  }
}

export const conditionSchema = z.object({
  condition: z.enum(CONDITIONS, { error: 'Escolha a condição.' }),
})

export type ConditionFields = z.infer<typeof conditionSchema>
