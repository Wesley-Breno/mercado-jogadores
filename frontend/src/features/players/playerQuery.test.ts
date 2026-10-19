import { describe, expect, it } from 'vitest'

import type { Club } from '../../api/types'
import {
  CLEARED_FILTERS,
  activeFilters,
  changeQuery,
  countRequest,
  isSearchTooShort,
  parseAge,
  parseMoney,
  readPlayerQuery,
  toRequest,
} from './playerQuery'

const AGUIAS: Club = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 300,
  squad_value: 0,
  net_worth: 300,
}

describe('readPlayerQuery', () => {
  it('lê os filtros do endereço com os nomes da API', () => {
    const params = new URLSearchParams(
      'search=davi&position=MEI&condition=APTO&free=false&club_id=2&min_age=18&max_age=30' +
        '&min_value=10.5&max_value=60&sort=value_desc&page=3',
    )

    expect(readPlayerQuery(params)).toEqual({
      search: 'davi',
      position: 'MEI',
      condition: 'APTO',
      free: false,
      club_id: 2,
      min_age: 18,
      max_age: 30,
      min_value: '10.5',
      max_value: '60',
      sort: 'value_desc',
      page: 3,
    })
  })

  it('ignora o que a API recusaria', () => {
    const params = new URLSearchParams(
      'position=XYZ&condition=apto&club_id=0&min_age=15&max_age=46&min_value=-1&sort=idade&page=1.5',
    )

    expect(readPlayerQuery(params)).toEqual(
      expect.objectContaining({
        position: undefined,
        condition: undefined,
        club_id: undefined,
        min_age: undefined,
        max_age: undefined,
        min_value: undefined,
        sort: undefined,
        page: undefined,
      }),
    )
  })

  it('descarta a faixa invertida e o clube junto com só livres', () => {
    const params = new URLSearchParams('free=true&club_id=2&min_age=30&max_age=18')

    expect(readPlayerQuery(params)).toEqual(
      expect.objectContaining({ free: true, club_id: undefined, min_age: undefined }),
    )
  })
})

describe('parseAge e parseMoney', () => {
  it('aceitam só idades de 16 a 45', () => {
    expect(parseAge(' 16 ')).toBe(16)
    expect(parseAge('45')).toBe(45)
    expect([parseAge('15'), parseAge('46'), parseAge('20.5'), parseAge('')]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ])
  })

  it('convertem o valor digitado com vírgula para o formato da API', () => {
    expect(parseMoney('10,50')).toBe('10.50')
    expect(parseMoney('10.5')).toBe('10.5')
    expect(parseMoney('007')).toBe('7')
    expect(parseMoney('550')).toBe('550')
    expect([parseMoney('550,01'), parseMoney('1,234'), parseMoney('-1'), parseMoney('')]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ])
  })
})

describe('pedido para a API', () => {
  it('deixa explícitos a ordem, a página e o limite de 10', () => {
    expect(toRequest({})).toEqual({ sort: 'name', page: 1, limit: 10 })
  })

  it('só busca a partir de 2 letras, com os espaços normalizados', () => {
    expect(toRequest({ search: ' a ' }).search).toBeUndefined()
    expect(toRequest({ search: '  davi   melo ' }).search).toBe('davi melo')
    expect(isSearchTooShort(' a ')).toBe(true)
    expect(isSearchTooShort('')).toBe(false)
  })

  it('volta para a primeira página quando um filtro muda', () => {
    expect(changeQuery({ page: 3, sort: 'age_asc' }, { position: 'GOL' })).toEqual({
      page: undefined,
      sort: 'age_asc',
      position: 'GOL',
    })
    expect(changeQuery({ page: 3 }, { page: 4 })).toEqual({ page: 4 })
  })

  it('conta cada aba com os mesmos filtros e um item só', () => {
    const request = toRequest({ condition: 'APTO', page: 2 })

    expect(countRequest(request, 'free')).toEqual({
      condition: 'APTO',
      free: true,
      sort: 'name',
      page: 1,
      limit: 1,
    })
  })
})

describe('activeFilters', () => {
  it('descreve cada filtro com o que o remove', () => {
    const query = {
      search: 'davi',
      condition: 'MAL_CONDICIONADO' as const,
      club_id: 1,
      min_age: 18,
      max_age: 30,
      min_value: '10',
      max_value: '60.5',
    }

    expect(activeFilters(query, new Map([[1, AGUIAS]]))).toEqual([
      { label: 'Busca: davi', clear: { search: undefined } },
      { label: 'Condição: Mal condicionado', clear: { condition: undefined } },
      { label: 'Clube: Águias FC', clear: { club_id: undefined } },
      { label: 'Idade: 18 a 30', clear: { min_age: undefined, max_age: undefined } },
      {
        label: 'Valor de mercado: 10,00 a 60,50',
        clear: { min_value: undefined, max_value: undefined },
      },
    ])
  })

  it('mostra faixas abertas de um lado', () => {
    const labels = activeFilters({ min_age: 18, max_value: '20' }, new Map()).map(
      (filter) => filter.label,
    )

    expect(labels).toEqual(['Idade: a partir de 18', 'Valor de mercado: até 20,00'])
  })

  it('limpar filtros mantém a aba e a ordem', () => {
    expect(changeQuery({ free: true, sort: 'age_asc', position: 'GOL' }, CLEARED_FILTERS)).toEqual(
      expect.objectContaining({ free: true, sort: 'age_asc', position: undefined }),
    )
  })
})
