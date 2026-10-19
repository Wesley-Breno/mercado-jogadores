import { describe, expect, it } from 'vitest'

import { matchSchema } from './matchForm'

describe('matchSchema', () => {
  it('envia os ids dos dois clubes', () => {
    expect(matchSchema.parse({ home_club_id: '1', away_club_id: '2' })).toEqual({
      home_club_id: 1,
      away_club_id: 2,
    })
  })

  it.each([
    [{ home_club_id: '', away_club_id: '2' }, 'Escolha o mandante.'],
    [{ home_club_id: '1', away_club_id: '' }, 'Escolha o visitante.'],
    [{ home_club_id: '1', away_club_id: '1' }, 'Escolha um clube diferente do mandante.'],
  ])('recusa %o com "%s"', (fields, message) => {
    expect(matchSchema.safeParse(fields).error?.issues[0]?.message).toBe(message)
  })
})
