import { describe, expect, it } from 'vitest'

import { fakePlayer } from '../../test/fakePlayer'
import { candidatesFor, distribute, missingSlots, playerIds, slotsOf } from './lineupSlots'

const GOL = fakePlayer({ id: 1, position: 'GOL' })
const ZAG = fakePlayer({ id: 2, position: 'ZAG' })
const LAT = fakePlayer({ id: 3, position: 'LAT' })
const MEI = fakePlayer({ id: 4, position: 'MEI' })
const ATA = fakePlayer({ id: 5, position: 'ATA' })
const SICK_ATA = fakePlayer({ id: 6, position: 'ATA', condition: 'DOENTE' })
const LAT_2 = fakePlayer({ id: 7, position: 'LAT', condition: 'MAL_CONDICIONADO' })

describe('slotsOf', () => {
  it('tem o goleiro e os 4 de linha de cada formação', () => {
    expect(slotsOf('2-1-1').map((slot) => slot.sector)).toEqual(['GOL', 'DEF', 'DEF', 'MEI', 'ATA'])
    expect(slotsOf('3-1').map((slot) => slot.sector)).toEqual(['GOL', 'DEF', 'DEF', 'DEF', 'ATA'])
    expect(slotsOf('2-2').map((slot) => slot.sector)).toEqual(['GOL', 'DEF', 'DEF', 'ATA', 'ATA'])
    expect(slotsOf('1-2-1').map((slot) => slot.sector)).toEqual(['GOL', 'DEF', 'MEI', 'MEI', 'ATA'])
  })
})

describe('distribute', () => {
  it('coloca a escalação salva nas vagas do setor de cada um', () => {
    expect(distribute('2-1-1', [GOL, ZAG, LAT, MEI, ATA])).toEqual({
      'GOL-0': 1,
      'DEF-0': 2,
      'DEF-1': 3,
      'MEI-0': 4,
      'ATA-0': 5,
    })
  })

  it('ao trocar de formação, deixa de fora quem não cabe', () => {
    expect(distribute('3-1', [GOL, ZAG, LAT, MEI, ATA])).toEqual({
      'GOL-0': 1,
      'DEF-0': 2,
      'DEF-1': 3,
      'ATA-0': 5,
    })
  })
})

describe('candidatesFor', () => {
  it('oferece só o setor certo, sem DOENTE e sem quem já está em outra vaga', () => {
    const squad = [GOL, ZAG, LAT, LAT_2, MEI, ATA, SICK_ATA]
    const [, firstDefence, secondDefence, , attack] = slotsOf('2-1-1')
    const choices = { 'DEF-0': 2 }

    expect(candidatesFor(attack, squad, choices).map((player) => player.id)).toEqual([5])
    expect(candidatesFor(secondDefence, squad, choices).map((player) => player.id)).toEqual([3, 7])
    expect(candidatesFor(firstDefence, squad, choices).map((player) => player.id)).toEqual([
      2, 3, 7,
    ])
  })
})

describe('missingSlots e playerIds', () => {
  it('aponta as vagas vazias e monta os ids na ordem das vagas', () => {
    const choices = { 'GOL-0': 1, 'DEF-0': 2, 'MEI-0': 4, 'ATA-0': 5 }

    expect(missingSlots('2-1-1', choices)).toEqual(['DEF-1'])
    expect(playerIds('2-1-1', { ...choices, 'DEF-1': 3 })).toEqual([1, 2, 3, 4, 5])
  })
})
