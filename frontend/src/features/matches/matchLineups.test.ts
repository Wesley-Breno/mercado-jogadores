import { describe, expect, it } from 'vitest'

import { AGUIAS_DELTA } from '../../test/fakeMatch'
import { duelValues, startersOf } from './matchLineups'

describe('titulares de uma partida jogada', () => {
  it('reúne os 5 de cada clube a partir dos duelos, na numeração da RN20', () => {
    const home = startersOf(AGUIAS_DELTA, 1)

    expect(home.map((player) => [player.name, player.line])).toEqual([
      ['Rui Prado', 0],
      ['Téo Brandão', 1],
      ['Davi Lins', 2],
      ['Lauro Neves', 3],
      ['Otto Rangel', 4],
    ])
    expect(startersOf(AGUIAS_DELTA, 2).map((player) => player.name)).toEqual([
      'Ivo Teles',
      'Hugo Vaz',
      'Lino Matos',
      'Nei Soares',
      'Ugo Falcão',
    ])
  })

  it('mostra os valores gravados: o 1º só defende, o 2º ataca e defende, o 3º e o 4º só atacam', () => {
    expect(startersOf(AGUIAS_DELTA, 1).map(duelValues)).toEqual([
      'GOL · Def 77',
      'ZAG · Def 84',
      'LAT · Dri 63 · Def 56',
      'MEI · Pas 82',
      'ATA · Fin 75',
    ])
  })

  it('marca o gol no atacante do duelo', () => {
    const away = startersOf(AGUIAS_DELTA, 2)

    expect(away.filter((player) => player.attack?.goal).map((player) => player.name)).toEqual([
      'Lino Matos',
      'Ugo Falcão',
    ])
  })
})
