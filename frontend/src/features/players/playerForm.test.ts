import { describe, expect, it } from 'vitest'

import { playerCreateSchema } from './playerForm'

const MEIA_LUA = {
  name: '  Meia   Lua ',
  position: 'MEI',
  agility: '85',
  age: '25',
  pace: '70',
  shooting: '68',
  passing: '82',
  dribbling: '79',
  defending: '55',
  physical: '64',
  potential: '86',
}

function firstError(changes: Record<string, unknown>): string | undefined {
  const result = playerCreateSchema.safeParse({ ...MEIA_LUA, ...changes })
  return result.error?.issues[0]?.message
}

describe('playerCreateSchema', () => {
  it('converte os campos no corpo do POST /players', () => {
    expect(playerCreateSchema.parse(MEIA_LUA)).toEqual({
      name: 'Meia Lua',
      position: 'MEI',
      agility: 85,
      age: 25,
      pace: 70,
      shooting: 68,
      passing: 82,
      dribbling: 79,
      defending: 55,
      physical: 64,
      potential: 86,
    })
  })

  it.each([
    [{ name: '' }, 'Informe o nome.'],
    [{ name: ' Da ' }, 'Use de 3 a 100 caracteres.'],
    [{ name: 'A'.repeat(101) }, 'Use de 3 a 100 caracteres.'],
    [{ position: undefined }, 'Escolha a posição.'],
    [{ position: 'mei' }, 'Escolha a posição.'],
    [{ age: '' }, 'Informe a idade.'],
    [{ age: '15' }, 'Use uma idade de 16 a 45 anos.'],
    [{ age: '46' }, 'Use uma idade de 16 a 45 anos.'],
    [{ age: '20.5' }, 'Use uma idade de 16 a 45 anos.'],
    [{ agility: '0' }, 'Use um valor de 1 a 100.'],
    [{ agility: '101' }, 'Use um valor de 1 a 100.'],
    [{ passing: '120' }, 'Use um valor de 1 a 99.'],
    [{ defending: '-1' }, 'Use um valor de 1 a 99.'],
    [{ potential: ' ' }, 'Informe o potencial.'],
  ])('recusa %o com "%s"', (changes, message) => {
    expect(firstError(changes)).toBe(message)
  })

  it('aceita os limites de cada campo', () => {
    expect(firstError({ age: '16', agility: '100', pace: '1', potential: '99' })).toBeUndefined()
    expect(firstError({ name: 'Ana', age: '45', agility: '1' })).toBeUndefined()
  })
})
