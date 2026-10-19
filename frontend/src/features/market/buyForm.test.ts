import { describe, expect, it } from 'vitest'

import { buySchema } from './buyForm'

function firstError(fields: Record<string, string>): string | undefined {
  return buySchema.safeParse(fields).error?.issues[0]?.message
}

describe('buySchema', () => {
  it('envia o fim da fidelidade digitado em Brasília com -03:00', () => {
    expect(buySchema.parse({ club_id: '6', date: '12/11/2027', time: '15:00' })).toEqual({
      club_id: 6,
      loyalty_until: '2027-11-12T15:00-03:00',
    })
  })

  it.each([
    [{ club_id: '', date: '12/11/2027', time: '15:00' }, 'Escolha o clube comprador.'],
    [{ club_id: '6', date: '', time: '15:00' }, 'Informe a data.'],
    [
      { club_id: '6', date: '31/02/2027', time: '15:00' },
      'Use uma data do calendário, como 12/11/2027.',
    ],
    [{ club_id: '6', date: '12/11/2027', time: '' }, 'Informe a hora.'],
    [{ club_id: '6', date: '12/11/2027', time: '24:00' }, 'Use uma hora de 00:00 a 23:59.'],
  ])('recusa %o com "%s"', (fields, message) => {
    expect(firstError(fields)).toBe(message)
  })
})
