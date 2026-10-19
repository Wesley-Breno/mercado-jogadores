import { describe, expect, it } from 'vitest'

import { breadcrumbFor } from './navigation'

describe('breadcrumbFor', () => {
  it.each([
    ['/jogadores', ['Mercado', 'Jogadores']],
    ['/clubes/3', ['Mercado', 'Clubes']],
    ['/partidas', ['Liga', 'Partidas']],
    ['/classificacao', ['Liga', 'Classificação']],
    ['/desconhecido', []],
  ])('%s', (pathname, expected) => {
    expect(breadcrumbFor(pathname)).toEqual(expected)
  })
})
